<?php
/**
 * Upload Project JSON ke Server
 * 
 * POST /api/upload.php
 * Headers: X-API-Key: your-api-key
 * Body (JSON): { "testId": "BBT-XXXXXXXX", "data": { ... } }
 * 
 * Atau upload via multipart form:
 * POST /api/upload.php
 * Form field: json_file (file .json)
 * Form field: test_id (string, optional - akan dibaca dari file)
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed. Use POST.', 405);
}

if (!validateApiKey()) {
    errorResponse('Invalid API key.', 401);
}

$testId = '';
$jsonData = null;

// Cek apakah multipart file upload atau raw JSON
if (!empty($_FILES['json_file']) && $_FILES['json_file']['error'] === UPLOAD_ERR_OK) {
    $fileContent = file_get_contents($_FILES['json_file']['tmp_name']);
    $jsonData = json_decode($fileContent, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('File JSON tidak valid: ' . json_last_error_msg());
    }
    
    $testId = isset($_POST['test_id']) ? $_POST['test_id'] : '';
    if (empty($testId)) {
        $testId = isset($jsonData['project']['testId']) ? $jsonData['project']['testId'] : '';
    }
    if (empty($testId)) {
        $testId = isset($jsonData['testId']) ? $jsonData['testId'] : '';
    }
    
    if (empty($testId)) {
        errorResponse('Test ID tidak ditemukan di file JSON.');
    }
    
    $testId = strtoupper(preg_replace('/[^A-Za-z0-9\-]/', '', $testId));
} else {
    $input = getJsonInput();
    
    $testId = isset($input['testId']) ? $input['testId'] : '';
    if (empty($testId)) {
        $testId = isset($input['data']['project']['testId']) ? $input['data']['project']['testId'] : '';
    }
    
    if (empty($testId)) {
        errorResponse('Field "testId" wajib diisi.');
    }
    
    $jsonData = isset($input['data']) ? $input['data'] : $input;
    $testId = strtoupper(preg_replace('/[^A-Za-z0-9\-]/', '', $testId));
}

// Validasi data
if ($jsonData === null) {
    errorResponse('Data JSON tidak valid.');
}

$safeFilename = preg_replace('/[^A-Za-z0-9\-]/', '', $testId);
$filePath = DATA_DIR . '/' . $safeFilename . '.json';

// Prepare save data
$saveData = array(
    'testId' => $testId,
    'uploadedAt' => date('c'),
    'version' => '1.0.0',
    'data' => $jsonData,
);

// Jika data format ExportData, simpan langsung
if (isset($jsonData['project']) && isset($jsonData['exportedBy'])) {
    $saveData = $jsonData;
    $saveData['uploadedAt'] = date('c');
}

// Encode ke JSON
$jsonString = json_encode($saveData);
if ($jsonString === false) {
    errorResponse('Gagal meng-encode data ke JSON: ' . json_last_error_msg());
}

// Simpan file
$writeResult = safeWriteFile($filePath, $jsonString);
if (!$writeResult) {
    if (DEBUG_MODE) {
        errorResponse('Gagal menyimpan file. Path: ' . $filePath . '. Cek permission folder data/', 500);
    } else {
        errorResponse('Gagal menyimpan file ke server.', 500);
    }
}

// Update index
$indexPath = DATA_DIR . '/index.json';
$index = array();
if (file_exists($indexPath)) {
    $indexContent = file_get_contents($indexPath);
    $index = json_decode($indexContent, true);
    if (!is_array($index)) $index = array();
}

$projectName = '';
if (isset($saveData['project']['name'])) {
    $projectName = $saveData['project']['name'];
} elseif (isset($saveData['data']['project']['name'])) {
    $projectName = $saveData['data']['project']['name'];
}

$appName = '';
if (isset($saveData['project']['applicationName'])) {
    $appName = $saveData['project']['applicationName'];
} elseif (isset($saveData['data']['project']['applicationName'])) {
    $appName = $saveData['data']['project']['applicationName'];
}

$testerName = '';
if (isset($saveData['exportedBy'])) {
    $testerName = $saveData['exportedBy'];
}

$entry = array(
    'testId' => $testId,
    'projectName' => $projectName,
    'applicationName' => $appName,
    'tester' => $testerName,
    'uploadedAt' => date('c'),
);

$found = false;
foreach ($index as &$item) {
    if ($item['testId'] === $testId) {
        $item = $entry;
        $found = true;
        break;
    }
}
unset($item);

if (!$found) {
    $index[] = $entry;
}

$indexJson = json_encode($index, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
safeWriteFile($indexPath, $indexJson);

jsonResponse(array(
    'success' => true,
    'message' => 'Project berhasil di-upload ke cloud.',
    'testId' => $testId,
    'url' => BASE_URL . '/api/download.php?id=' . urlencode($testId),
));

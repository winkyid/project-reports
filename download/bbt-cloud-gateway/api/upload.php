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

// Cek apakah multipart file upload atau raw JSON
if (isset($_FILES['json_file']) && $_FILES['json_file']['error'] === UPLOAD_ERR_OK) {
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
        errorResponse('Test ID tidak ditemukan di file JSON. Tambahkan field "test_id" di form.');
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

$safeFilename = preg_replace('/[^A-Za-z0-9\-]/', '', $testId);
$filePath = DATA_DIR . '/' . $safeFilename . '.json';

// Save file
$saveData = [
    'testId' => $testId,
    'uploadedAt' => date('Y-m-d\TH:i:s\Z'),
    'version' => '1.0.0',
    'data' => $jsonData,
];

// Jika data format ExportData, simpan langsung
if (isset($jsonData['project']) && isset($jsonData['exportedBy'])) {
    $saveData = $jsonData;
    $saveData['uploadedAt'] = date('Y-m-d\TH:i:s\Z');
}

file_put_contents($filePath, json_encode($saveData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// Update index
$indexPath = DATA_DIR . '/index.json';
$index = [];
if (file_exists($indexPath)) {
    $index = json_decode(file_get_contents($indexPath), true) ?: [];
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

$entry = [
    'testId' => $testId,
    'projectName' => $projectName,
    'applicationName' => $appName,
    'tester' => $testerName,
    'uploadedAt' => date('Y-m-d\TH:i:s\Z'),
];

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

file_put_contents($indexPath, json_encode($index, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

jsonResponse([
    'success' => true,
    'message' => 'Project berhasil di-upload ke cloud.',
    'testId' => $testId,
    'url' => BASE_URL . '/api/download.php?id=' . urlencode($testId),
]);

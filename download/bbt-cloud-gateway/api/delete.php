<?php
/**
 * Delete Project dari Server
 * 
 * DELETE /api/delete.php?id=BBT-XXXXXXXX
 * Headers: X-API-Key: your-api-key
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    errorResponse('Method not allowed. Use POST or DELETE.', 405);
}

if (!validateApiKey()) {
    errorResponse('Invalid API key.', 401);
}

$testId = isset($_GET['id']) ? $_GET['id'] : '';
if (empty($testId)) {
    // Coba dari body
    $input = getJsonInput();
    $testId = isset($input['testId']) ? $input['testId'] : '';
}

if (empty($testId)) {
    errorResponse('Parameter "id" (Test ID) wajib diisi.');
}

$safeFilename = preg_replace('/[^A-Za-z0-9\-]/', '', $testId);
$filePath = DATA_DIR . '/' . $safeFilename . '.json';

if (!file_exists($filePath)) {
    errorResponse('Project dengan Test ID "' . $testId . '" tidak ditemukan.', 404);
}

unlink($filePath);

// Update index
$indexPath = DATA_DIR . '/index.json';
if (file_exists($indexPath)) {
    $index = json_decode(file_get_contents($indexPath), true) ?: [];
    $index = array_values(array_filter($index, function ($item) use ($testId) {
        return $item['testId'] !== $testId;
    }));
    file_put_contents($indexPath, json_encode($index, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

jsonResponse([
    'success' => true,
    'message' => 'Project dengan Test ID "' . $testId . '" berhasil dihapus.',
]);

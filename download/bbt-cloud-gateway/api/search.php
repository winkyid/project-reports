<?php
/**
 * Cari Project berdasarkan Test ID atau keyword
 * 
 * GET /api/search.php?q=BBT-XXXXXXXX
 * GET /api/search.php?q=keyword
 * 
 * Search akan mencari di index.json berdasarkan:
 * - testId (exact & partial match)
 * - projectName (partial match)
 * - applicationName (partial match)
 * 
 * Return: array of matching projects (tanpa data lengkap, hanya metadata)
 * Untuk mendapatkan data lengkap, gunakan download.php?id=TEST_ID
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed. Use GET.', 405);
}

$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query)) {
    // Return semua index jika query kosong
    $indexPath = DATA_DIR . '/index.json';
    if (file_exists($indexPath)) {
        $index = json_decode(file_get_contents($indexPath), true) ?: [];
        jsonResponse([
            'success' => true,
            'query' => '',
            'results' => $index,
            'total' => count($index),
        ]);
    }
    jsonResponse(['success' => true, 'query' => '', 'results' => [], 'total' => 0]);
}

$indexPath = DATA_DIR . '/index.json';
if (!file_exists($indexPath)) {
    jsonResponse(['success' => true, 'query' => $query, 'results' => [], 'total' => 0]);
}

$index = json_decode(file_get_contents($indexPath), true) ?: [];
$queryUpper = strtoupper($query);

$results = array_filter($index, function ($item) use ($queryUpper) {
    $testId = isset($item['testId']) ? strtoupper($item['testId']) : '';
    $name = isset($item['projectName']) ? strtoupper($item['projectName']) : '';
    $app = isset($item['applicationName']) ? strtoupper($item['applicationName']) : '';
    
    return strpos($testId, $queryUpper) !== false
        || strpos($name, $queryUpper) !== false
        || strpos($app, $queryUpper) !== false;
});

$results = array_values($results);

jsonResponse([
    'success' => true,
    'query' => $query,
    'results' => $results,
    'total' => count($results),
]);

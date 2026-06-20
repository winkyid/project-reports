<?php
/**
 * BBT Reporter - Cloud Gateway Configuration
 * 
 * Upload seluruh folder ini ke hosting PHP (InfinityFree, dll).
 * Edit konfigurasi di bawah sesuai kebutuhan.
 */

// API Key untuk keamanan upload/download.
// Isi dengan string random yang rumit. Wajib diubah!
// Biarkan kosong '' jika tidak mau pakai API key (tidak disarankan untuk public).
define('API_KEY', 'bbt-reporter-2024-change-this-key');

// Direktori penyimpanan file JSON (relatif dari root folder ini)
define('DATA_DIR', __DIR__ . '/data');

// URL dasar gateway (otomatis, biasanya tidak perlu diubah)
// Jika InfinityFree mu di subfolder, sesuaikan. Contoh: 'https://domain.com/bbt-gateway'
// define('BASE_URL', 'https://yourdomain.com/bbt-gateway');
define('BASE_URL', '');

// Aktifkan error reporting untuk debugging (set false di production)
define('DEBUG_MODE', true);

// Aktifkan CORS untuk frontend yang di-host terpisah
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Pastikan folder data ada
if (!is_dir(DATA_DIR)) {
    $mkdirResult = @mkdir(DATA_DIR, 0755, true);
    if (!$mkdirResult && !is_dir(DATA_DIR)) {
        if (DEBUG_MODE) {
            jsonResponse(['success' => false, 'error' => 'Gagal membuat folder data. Path: ' . DATA_DIR . ', Permission issue?'], 500);
        }
        exit;
    }
}

// Pastikan index.json ada
$indexPath = DATA_DIR . '/index.json';
if (!file_exists($indexPath)) {
    @file_put_contents($indexPath, '[]');
}

// Fungsi validasi API Key
function validateApiKey() {
    $key = API_KEY;
    if ($key === '') return true; // Skip jika kosong
    
    $providedKey = '';
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        $providedKey = $_SERVER['HTTP_X_API_KEY'];
    } elseif (isset($_GET['key'])) {
        $providedKey = $_GET['key'];
    } elseif (isset($_POST['key'])) {
        $providedKey = $_POST['key'];
    }
    
    return hash_equals($key, $providedKey);
}

// Fungsi response JSON
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Fungsi error response
function errorResponse($message, $code = 400) {
    jsonResponse(['success' => false, 'error' => $message], $code);
}

// Fungsi ambil input JSON dari request body
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        errorResponse('Request body kosong.');
    }
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('Invalid JSON: ' . json_last_error_msg());
    }
    return $data;
}

// Fungsi tulis file yang aman (fallback jika file_put_contents gagal)
function safeWriteFile($filePath, $content) {
    // Method 1: file_put_contents
    $result = @file_put_contents($filePath, $content);
    if ($result !== false) return true;
    
    // Method 2: fopen + fwrite + fclose
    $fp = @fopen($filePath, 'w');
    if ($fp !== false) {
        $written = @fwrite($fp, $content);
        @fclose($fp);
        if ($written !== false) return true;
    }
    
    return false;
}

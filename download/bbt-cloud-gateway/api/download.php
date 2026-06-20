<?php
/**
 * Download Project JSON dari Server
 * 
 * GET /api/download.php?id=BBT-XXXXXXXX
 * GET /api/download.php?id=BBT-XXXXXXXX&key=your-api-key
 * 
 * Jika ?format=html akan generate HTML report langsung
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed. Use GET.', 405);
}

// Download endpoint biasanya publik (untuk sharing)
// Tapi bisa diproteksi API key jika mau
// if (!validateApiKey()) {
//     errorResponse('Invalid API key.', 401);
// }

$testId = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($testId)) {
    errorResponse('Parameter "id" (Test ID) wajib diisi.');
}

$testId = strtoupper(preg_replace('/[^A-Za-z0-9\-]/', '', $testId));
$safeFilename = preg_replace('/[^A-Za-z0-9\-]/', '', $testId);
$filePath = DATA_DIR . '/' . $safeFilename . '.json';

if (!file_exists($filePath)) {
    errorResponse('Project dengan Test ID "' . $testId . '" tidak ditemukan.', 404);
}

$fileContent = file_get_contents($filePath);
$jsonData = json_decode($fileContent, true);

// Jika format=html, generate HTML report
$format = isset($_GET['format']) ? $_GET['format'] : 'json';

if ($format === 'html' && isset($jsonData['project'])) {
    // Generate HTML report from project data
    $project = $jsonData['project'];
    $html = generateHTMLReport($project, $jsonData['uploadedAt'] ?? '');
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

// Default: return JSON
header('Content-Type: application/json; charset=utf-8');
header('Content-Disposition: inline; filename="' . $safeFilename . '.json"');
echo $fileContent;
exit;

/**
 * Generate standalone HTML report
 */
function generateHTMLReport($project, $uploadedAt) {
    $testerName = isset($project['testerName']) ? htmlspecialchars($project['testerName']) : 'N/A';
    $isAnon = (strpos($testerName, '***') !== false);
    $exportDate = $uploadedAt ? date('d F Y', strtotime($uploadedAt)) : date('d F Y');
    
    $passCount = 0;
    $failCount = 0;
    $totalCases = 0;
    
    $categoriesHtml = '';
    if (isset($project['categories']) && is_array($project['categories'])) {
        foreach ($project['categories'] as $cat) {
            $testCasesHtml = '';
            if (isset($cat['testCases']) && is_array($cat['testCases'])) {
                foreach ($cat['testCases'] as $tc) {
                    $totalCases++;
                    if (isset($tc['status']) && $tc['status'] === 'pass') $passCount++;
                    if (isset($tc['status']) && $tc['status'] === 'fail') $failCount++;
                    
                    $statusColor = '#6b7280';
                    $statusLabel = 'BELUM UJI';
                    if (isset($tc['status'])) {
                        switch ($tc['status']) {
                            case 'pass': $statusColor = '#10b981'; $statusLabel = 'LULUS'; break;
                            case 'fail': $statusColor = '#ef4444'; $statusLabel = 'GAGAL'; break;
                            case 'blocked': $statusColor = '#f59e0b'; $statusLabel = 'DIBLOKIR'; break;
                            case 'skip': $statusColor = '#3b82f6'; $statusLabel = 'LEWATI'; break;
                        }
                    }
                    
                    $no = isset($tc['no']) ? $tc['no'] : $totalCases;
                    $scenario = isset($tc['testScenario']) ? htmlspecialchars($tc['testScenario']) : '-';
                    $dataUji = isset($tc['testSteps']) ? htmlspecialchars($tc['testSteps']) : '-';
                    $expected = isset($tc['expectedBehavior']) ? htmlspecialchars($tc['expectedBehavior']) : '-';
                    $actual = isset($tc['actualBehavior']) ? htmlspecialchars($tc['actualBehavior']) : '-';
                    
                    $testCasesHtml .= '<tr>
                        <td style="text-align:center;font-family:monospace;font-weight:600">' . $no . '</td>
                        <td style="white-space:pre-line">' . $scenario . '</td>
                        <td style="white-space:pre-line">' . $dataUji . '</td>
                        <td style="white-space:pre-line">' . $expected . '</td>
                        <td style="white-space:pre-line">' . $actual . '</td>
                        <td><span style="color:' . $statusColor . ';font-weight:600">' . $statusLabel . '</span></td>
                    </tr>';
                }
            }
            
            $catName = isset($cat['name']) ? htmlspecialchars($cat['name']) : 'Unnamed';
            $catDesc = isset($cat['description']) ? htmlspecialchars($cat['description']) : '';
            $catUrl = isset($cat['uiUrl']) ? htmlspecialchars($cat['uiUrl']) : '';
            
            $categoriesHtml .= '<div class="category-section">
                <h2>' . $catName . '</h2>
                ' . ($catDesc ? '<p class="category-desc">' . $catDesc . '</p>' : '') . '
                ' . ($catUrl ? '<p class="category-url">UI URL: ' . $catUrl . '</p>' : '') . '
                <div class="table-wrapper"><table>
                    <thead><tr>
                        <th>Kode Uji</th><th>Detail Skenario</th><th>Data Uji</th>
                        <th>Ekspektasi</th><th>Hasil Aktual</th><th>Status</th>
                    </tr></thead>
                    <tbody>' . $testCasesHtml . '</tbody>
                </table></div>
            </div>';
        }
    }
    
    $passRate = $totalCases > 0 ? number_format(($passCount / $totalCases) * 100, 1) : '0.0';
    $projectName = isset($project['name']) ? htmlspecialchars($project['name']) : 'Untitled';
    $testId = isset($project['testId']) ? htmlspecialchars($project['testId']) : 'N/A';
    $appName = isset($project['applicationName']) ? htmlspecialchars($project['applicationName']) : 'N/A';
    $env = isset($project['environment']) ? htmlspecialchars($project['environment']) : 'N/A';
    $desc = isset($project['description']) ? htmlspecialchars($project['description']) : '';
    
    return '<!DOCTYPE html>
<html lang="id"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>' . $projectName . ' - Laporan Black Box Testing</title>
<meta name="test-id" content="' . $testId . '">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;color:#1a1a1a;background:#f9fafb;padding:2rem}
.container{max-width:1200px;margin:0 auto}
.report-header{background:#fff;border-radius:12px;padding:2rem;margin-bottom:2rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.report-header h1{font-size:1.5rem;margin-bottom:.5rem}
.test-id{color:#6b7280;font-family:monospace;font-size:.9rem}
.meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem;padding-top:1rem;border-top:1px solid #e5e7eb}
.meta-item label{display:block;font-size:.75rem;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
.meta-item span{font-weight:500}
.summary-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:2rem}
.summary-card{background:#fff;border-radius:12px;padding:1.5rem;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.summary-card .value{font-size:2rem;font-weight:700}
.summary-card .label{font-size:.85rem;color:#6b7280}
.summary-card.pass .value{color:#10b981}
.summary-card.fail .value{color:#ef4444}
.summary-card.rate .value{color:#3b82f6}
.category-section{background:#fff;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.category-section h2{font-size:1.2rem;margin-bottom:.5rem}
.category-desc,.category-url{color:#6b7280;font-size:.9rem;margin-bottom:1rem}
.table-wrapper{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{background:#f3f4f6;padding:.75rem;text-align:left;font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#374151;border-bottom:2px solid #e5e7eb;white-space:nowrap}
td{padding:.75rem;border-bottom:1px solid #e5e7eb;vertical-align:top}
tr:hover{background:#f9fafb}
.footer{text-align:center;color:#9ca3af;font-size:.8rem;margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb}
@media print{body{padding:1rem}.summary-card,.category-section{box-shadow:none;border:1px solid #e5e7eb}}
</style></head><body>
<div class="container">
<div class="report-header">
<h1>' . $projectName . '</h1>
<div class="test-id">Test ID: ' . $testId . '</div>
<div class="meta-grid">
<div class="meta-item"><label>Aplikasi</label><span>' . $appName . '</span></div>
<div class="meta-item"><label>Environment</label><span>' . $env . '</span></div>
<div class="meta-item"><label>Tester</label><span>' . $testerName . '</span></div>
<div class="meta-item"><label>Tanggal Report</label><span>' . $exportDate . '</span></div>
</div>
' . ($desc ? '<p style="margin-top:1rem;color:#4b5563">' . $desc . '</p>' : '') . '
</div>
<div class="summary-cards">
<div class="summary-card pass"><div class="value">' . $passCount . '</div><div class="label">Lulus</div></div>
<div class="summary-card fail"><div class="value">' . $failCount . '</div><div class="label">Gagal</div></div>
<div class="summary-card"><div class="value">' . $totalCases . '</div><div class="label">Total Kasus Uji</div></div>
<div class="summary-card rate"><div class="value">' . $passRate . '%</div><div class="label">Tingkat Kelulusan</div></div>
</div>
' . $categoriesHtml . '
<div class="footer"><p>Generated by BBT Reporter Cloud | Test ID: ' . $testId . ' | ' . $exportDate . '</p></div>
</div></body></html>';
}

<?php
// phase-1-waitlist/landing-page/track.php
// Simple page view tracking (can be expanded later)

require_once 'config.php';

$page = $_GET['page'] ?? 'index';
$ref = $_GET['ref'] ?? null;
$ip = $_SERVER['REMOTE_ADDR'];
$ua = $_SERVER['HTTP_USER_AGENT'];

// Log to a file for now (simple)
$log = date('Y-m-d H:i:s') . " | $page | Ref: $ref | IP: $ip | UA: $ua" . PHP_EOL;
file_put_contents('views.log', $log, FILE_APPEND);

// Future: Store in database
/*
try {
    $stmt = $pdo->prepare("INSERT INTO page_views (page, referral_code, ip_address, user_agent) VALUES (?, ?, ?, ?)");
    $stmt->execute([$page, $ref, $ip, $ua]);
} catch (Exception $e) {
    // Ignore errors
}
*/

// Transparent pixel response
header('Content-Type: image/gif');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
exit;
?>

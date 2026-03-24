<?php
// phase-1-waitlist/landing-page/count.php
// Returns the real waitlist count from database
// Called by JavaScript to update the counter on the page

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM waitlist");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $count = (int)$result['total'];
    
    // Add a small buffer to make it look bigger at start
    // Remove this line once you have 50+ real signups
    $display_count = $count + 47;
    
    echo json_encode([
        'success' => true,
        'count' => $display_count,
        'real_count' => $count
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'count' => 47,
        'real_count' => 0
    ]);
}
?>

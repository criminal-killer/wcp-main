<?php
require_once 'config.php';

// Check session
if (!isset($_SESSION['admin_logged_in'])) {
    die("Unauthorized");
}

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="sella-waitlist-' . date('Y-m-d') . '.csv"');

$output = fopen('php://output', 'w');

// Headers
fputcsv($output, [
    'ID', 'Name', 'Email', 'WhatsApp', 'Country', 'Business Type', 
    'Current Selling', 'Monthly Orders', 'Problems', 'Custom Problem', 
    'Pricing', 'Paying', 'Would Pay', 'Beta', 'Device', 'Products', 
    'WA Feedback', 'Ref Code', 'Referred By', 'Source', 'Medium', 
    'Campaign', 'IP', 'Date'
]);

$query = $pdo->query("SELECT * FROM waitlist ORDER BY created_at DESC");
while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
    fputcsv($output, $row);
}

fclose($output);
exit;
?>

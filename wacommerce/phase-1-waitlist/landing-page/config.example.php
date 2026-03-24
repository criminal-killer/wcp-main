<?php
// COPY this file to config.php and fill in your real credentials
// config.php is gitignored — it will NOT be pushed to GitHub

$db_host = 'YOUR_DB_HOST';
$db_name = 'YOUR_DB_NAME';
$db_user = 'YOUR_DB_USER';
$db_pass = 'YOUR_DB_PASS';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("DB connection failed: " . $e->getMessage());
}

$app_name = "Sella";
$app_url = "https://sella.kesug.com";
$admin_password = "CHANGE_THIS_PASSWORD";
?>

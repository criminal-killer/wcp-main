<?php
require_once 'config.php';

$position = $_GET['pos'] ?? $_SESSION['last_position'] ?? null;
$ref_code = $_GET['ref'] ?? $_SESSION['last_ref'] ?? null;

// If no position, get latest count as a generic fallback
if (!$position) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM waitlist");
        $result = $stmt->fetch();
        $position = (int)$result['total'] + 47;
    } catch (Exception $e) {
        $position = "XX";
    }
}

$share_url = $app_url . "/?ref=" . ($ref_code ?? "JOIN");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎉 You're on the list! — Sella</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        body { 
            background: #f0fdf4; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            font-family: 'Inter', sans-serif;
        }
        .thank-you-card { 
            background: white;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 500px; 
            width: 100%;
            text-align: center; 
        }
        .pos-number {
            font-size: 48px;
            font-weight: 800;
            color: #059669;
            margin: 20px 0;
        }
        .share-box {
            background: #f9fafb;
            padding: 15px;
            border-radius: 12px;
            border: 1px dashed #d1d5db;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="thank-you-card">
        <h1 style="font-size: 32px; margin-bottom: 10px;">🎉 You're In!</h1>
        <p>You've successfully joined the SELLA waitlist.</p>
        
        <div class="pos-number">#<?php echo htmlspecialchars($position); ?></div>
        <p style="color: #6b7280;">on the waitlist</p>

        <div style="margin-top: 30px; text-align: left;">
            <p style="font-weight: 600; margin-bottom: 8px;">Want to move up faster?</p>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">Share your unique link with other business owners:</p>
            <div class="share-box"><?php echo htmlspecialchars($share_url); ?></div>
        </div>

        <br>
        <a href="index.html" class="btn btn-primary" style="display: block; width: 100%;">Back to Homepage</a>
    </div>
</body>
</html>


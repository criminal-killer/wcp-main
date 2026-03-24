<?php
require_once 'config.php';

// Simple password check
if (!isset($_SESSION['admin_logged_in'])) {
    if (isset($_POST['password']) && $_POST['password'] === $admin_password) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        ?>
        <!DOCTYPE html>
        <html>
        <head><title>Admin Login</title>
        <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f3f4f6;}
        form{background:white;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}
        input{padding:10px;margin:10px 0;width:100%;border:1px solid #ddd;border-radius:4px;}
        button{background:#25D366;color:white;border:none;padding:10px;width:100%;border-radius:4px;cursor:pointer;font-weight:700;}</style>
        </head>
        <body>
            <form method="POST">
                <h2>Sella Admin</h2>
                <input type="password" name="password" placeholder="Admin Password" required>
                <button type="submit">Login</button>
            </form>
        </body>
        </html>
        <?php
        exit;
    }
}

// Fetch Stats
$total = $pdo->query("SELECT COUNT(*) FROM waitlist")->fetchColumn();
$beta = $pdo->query("SELECT COUNT(*) FROM waitlist WHERE wants_beta = 1")->fetchColumn();

// Country Breakdown
$countries = $pdo->query("SELECT country, COUNT(*) as count FROM waitlist GROUP BY country ORDER BY count DESC")->fetchAll();

// Recent Signups
$recent = $pdo->query("SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 50")->fetchAll();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sella Admin Dashboard</title>
    <style>
        :root { --primary: #25D366; --dark: #1a1a1a; }
        body { font-family: 'Inter', sans-serif; margin: 0; background: #f9fafb; font-size: 14px; }
        .sidebar { width: 240px; height: 100vh; background: #111827; color: white; position: fixed; padding: 20px; }
        .content { margin-left: 240px; padding: 40px; }
        .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { margin: 0; color: #6b7280; font-size: 0.9rem; text-transform: uppercase; }
        .card .value { font-size: 2rem; font-weight: 800; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #f3f4f6; }
        th { background: #f9fafb; color: #6b7280; }
        .btn-export { background: var(--primary); color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; float: right; font-weight: 600; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>Sella Admin</h2>
        <p>Dashboard</p>
        <p><a href="export.php" style="color:white;">Export CSV</a></p>
        <p><a href="index.html" style="color:white;">View Site</a></p>
    </div>
    <div class="content">
        <a href="export.php" class="btn-export">Export CSV</a>
        <h1>Dashboard Overview</h1>
        
        <div class="card-grid">
            <div class="card">
                <h3>Total Signups</h3>
                <div class="value"><?php echo $total; ?></div>
            </div>
            <div class="card">
                <h3>Beta Testers</h3>
                <div class="value"><?php echo $beta; ?></div>
            </div>
            <div class="card">
                <h3>Conversion Rate</h3>
                <div class="value">--</div>
            </div>
        </div>

        <h2>Waitlist Entries (Recent 50)</h2>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>Country</th>
                    <th>Type</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($recent as $row): ?>
                <tr>
                    <td><?php echo htmlspecialchars($row['full_name']); ?></td>
                    <td><?php echo htmlspecialchars($row['email']); ?></td>
                    <td><?php echo htmlspecialchars($row['whatsapp']); ?></td>
                    <td><?php echo htmlspecialchars($row['country']); ?></td>
                    <td><?php echo htmlspecialchars($row['business_type']); ?></td>
                    <td><?php echo $row['created_at']; ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>

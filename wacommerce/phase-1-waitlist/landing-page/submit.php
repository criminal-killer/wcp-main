<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// 1. Sanitize Inputs
$full_name = filter_input(INPUT_POST, 'full_name', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$whatsapp = filter_input(INPUT_POST, 'whatsapp', FILTER_SANITIZE_STRING);
$country = filter_input(INPUT_POST, 'country', FILTER_SANITIZE_STRING);
if ($country === 'Other' && !empty($_POST['custom_country'])) {
    $country = filter_input(INPUT_POST, 'custom_country', FILTER_SANITIZE_STRING);
}

$country_code = filter_input(INPUT_POST, 'country_code', FILTER_SANITIZE_STRING);
if ($country_code === 'other' && !empty($_POST['custom_country_code'])) {
    $country_code = filter_input(INPUT_POST, 'custom_country_code', FILTER_SANITIZE_STRING);
}

// Optional fields
$business_type = filter_input(INPUT_POST, 'business_type', FILTER_SANITIZE_STRING);
$current_selling = isset($_POST['current_selling']) ? json_encode($_POST['current_selling']) : null;
$monthly_orders = filter_input(INPUT_POST, 'monthly_orders', FILTER_SANITIZE_STRING);
$problems = isset($_POST['problems']) ? json_encode($_POST['problems']) : null;
$custom_problem = filter_input(INPUT_POST, 'frustration', FILTER_SANITIZE_STRING);
$pricing_willingness = filter_input(INPUT_POST, 'pricing_willingness', FILTER_SANITIZE_STRING);
$currently_paying = filter_input(INPUT_POST, 'currently_paying', FILTER_SANITIZE_STRING);
$would_pay = filter_input(INPUT_POST, 'would_pay', FILTER_SANITIZE_STRING);
$wants_beta = isset($_POST['wants_beta']) ? 1 : 0;
$device = filter_input(INPUT_POST, 'device', FILTER_SANITIZE_STRING);
$product_count = filter_input(INPUT_POST, 'product_count', FILTER_SANITIZE_STRING);
$can_feedback = isset($_POST['can_feedback']) ? 1 : 0;
$referred_by = filter_input(INPUT_POST, 'ref', FILTER_SANITIZE_STRING);
$heard_from = filter_input(INPUT_POST, 'heard_from', FILTER_SANITIZE_STRING);

// 2. Validate
if (empty($full_name) || empty($email) || empty($whatsapp) || empty($country)) {
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email format']);
    exit;
}

// 3. Generate Referral Code
$ref_base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', substr($full_name, 0, 4)));
$referral_code = $ref_base . '-' . substr(md5(uniqid(mt_rand(), true)), 0, 4);

// 4. Capture Meta Data
$ip_address = $_SERVER['REMOTE_ADDR'];
$utm_source = filter_input(INPUT_GET, 'utm_source', FILTER_SANITIZE_STRING);
$utm_medium = filter_input(INPUT_GET, 'utm_medium', FILTER_SANITIZE_STRING);
$utm_campaign = filter_input(INPUT_GET, 'utm_campaign', FILTER_SANITIZE_STRING);

try {
    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM waitlist WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'You are already on the waitlist!']);
        exit;
    }

    // Insert into waitlist
    $sql = "INSERT INTO waitlist (
        full_name, email, whatsapp, country, business_type, current_selling, 
        monthly_orders, problems, custom_problem, pricing_willingness, 
        currently_paying, would_pay, wants_beta, device, product_count, 
        can_whatsapp_feedback, referral_code, referred_by, heard_from, 
        utm_source, utm_medium, utm_campaign, ip_address
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $full_name, $email, $country_code . $whatsapp, $country, $business_type, $current_selling,
        $monthly_orders, $problems, $custom_problem, $pricing_willingness,
        $currently_paying, $would_pay, $wants_beta, $device, $product_count,
        $can_feedback, $referral_code, $referred_by, $heard_from,
        $utm_source, $utm_medium, $utm_campaign, $ip_address
    ]);

    // Get new position from source of truth (waitlist table)
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM waitlist");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $real_count = (int)$result['total'];
    
    // Add same buffer as count.php for consistency (social proof)
    $display_position = $real_count + 47;

    echo json_encode([
        'success' => true, 
        'position' => $display_position, 
        'referral_code' => $referral_code,
        'real_count' => $real_count
    ]);

} catch (PDOException $e) {
    error_log("Insert error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error. Please try again later.']);
}
?>


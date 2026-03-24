-- Database Schema for SELLA Waitlist

CREATE TABLE IF NOT EXISTS waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(30),
    country VARCHAR(100),
    business_type VARCHAR(100),
    current_selling TEXT, -- Stored as JSON string
    monthly_orders VARCHAR(50),
    problems TEXT, -- Stored as JSON string
    custom_problem TEXT,
    pricing_willingness VARCHAR(50),
    currently_paying VARCHAR(50),
    would_pay VARCHAR(50),
    wants_beta TINYINT DEFAULT 0,
    device VARCHAR(50),
    product_count VARCHAR(50),
    can_whatsapp_feedback TINYINT DEFAULT 0,
    referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50),
    heard_from VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waitlist_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize stats with a placeholder number for social proof
INSERT INTO waitlist_stats (total_count) VALUES (47) ON DUPLICATE KEY UPDATE total_count = total_count;

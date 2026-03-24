# SELLA Phase 1 — Setup Guide

This directory contains everything needed to launch the **SELLA** waitlist landing page and the automated outreach pipeline.

---

## 1. Landing Page Setup (InfinityFree / PHP Hosting)

### Database Configuration
1. Log in to your InfinityFree Control Panel.
2. Create a new **MySQL Database** (e.g., `if0_38000000_sella`).
3. Open **phpMyAdmin** and import `landing-page/database.sql`.
4. Update `landing-page/config.php` with your database credentials:
   - `$db_host`: Usually something like `sql123.infinityfree.com`
   - `$db_user`: Your vPanel username
   - `$db_pass`: Your hosting password
   - `$db_name`: The database name you created

### Deployment
1. Upload all files from the `landing-page/` directory to your `htdocs/` folder via FTP or the online file manager.
2. Visit your domain to verify the page is live.
3. Test the form to ensure data is saved to the database.

---

## 2. Automation Setup (GitHub Actions)

The automation scripts use **GitHub Actions** to run on a schedule. You need to configure **GitHub Secrets** for them to work.

### GitHub Secrets to Add:
Go to your repo `Settings > Secrets and variables > Actions` and add:

| Secret Name | Description |
| ----------- | ----------- |
| `WAITLIST_URL` | Your landing page URL (e.g., `https://sella.io`) |
| `FACEBOOK_PAGE_ID` | Your FB Page ID for posts and comments. |
| `FACEBOOK_ACCESS_TOKEN` | Page Access Token from Meta Developers. |
| `SMTP_HOST` | Your email provider SMTP host. |
| `SMTP_PORT` | Usually `587`. |
| `SMTP_USER` | Your email address. |
| `SMTP_PASS` | Your email app password. |
| `FROM_EMAIL` | The 'from' address (same as SMTP_USER). |

### Scheduled Tasks:
- **Social Media Posts**: Runs daily. Pulls from `automation/content-bank.json`.
- **Comment Bot**: Runs every 3 hours. Checks for keywords like `READY` or `SELL`.
- **Cold Email Outreach**: Runs Mon-Fri. Scrapes businesses in a target city (default: Nairobi) and sends batches of 20 emails.

---

## 3. Directory Structure
```
phase-1-waitlist/
├── landing-page/      # PHP/HTML/CSS/JS (Upload to host)
│   ├── admin.php      # Waitlist dashboard
│   ├── export.php     # Export to CSV
│   └── ...
└── automation/        # Node.js scripts (GitHub Actions)
    ├── scripts/       # Posting, Scraping, Emailing logic
    ├── email-templates/ # Outreach email layouts
    └── content-bank.json # 21-day social media plan
```

---

## 4. Admin Dashboard
Access your waitlist data at `yourdomain.com/admin.php`.
- **Default Password**: `SellaBeta2025` (Change this in `config.php`)
- **Features**: View total count, view entries, and export to CSV.

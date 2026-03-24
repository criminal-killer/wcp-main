# Admin Dashboard Specification
# SELLA — Platform Owner Panel

---

## 1. Overview

The admin panel is ONLY accessible by the platform owner (founder).
URL: `/admin` (within the main Next.js app)
Access: Clerk auth + `ADMIN_USER_ID` env var check

---

## 2. Admin Overview (/admin)

### Metrics Cards
- Total Users (all time)
- Active Subscribers (paying customers)
- MRR (Monthly Recurring Revenue)
- New Signups Today

### Summary Lists
- **Users by Plan:** trial, free, starter, growth, premium (count + percentage)
- **Users by Country:** top 10 countries with count
- **Recent Signups:** last 10 users with name, plan, country, date
- **Revenue this month vs last month**

---

## 3. User Management (/admin/users)

### Table Columns
| Column | Description |
|--------|-------------|
| Name | User's name |
| Email | User's email |
| Organization | Store name |
| Plan | Current plan (badge) |
| Country | Country flag + name |
| Orders | Total orders processed |
| Revenue | Total store revenue generated |
| Status | Active / Trial / Free / Suspended |
| Joined | Signup date |
| Actions | Edit / Impersonate / Suspend |

### Actions
- **Edit Plan:** Dropdown to change plan (free/starter/growth/premium)
- **Give Free Months:** Add X months of free service
- **Suspend:** Disable account
- **Impersonate:** See what user sees (for debugging)
- **Send Message:** Send email or WhatsApp to this user
- **Bulk Import:** CSV upload to create users (for waitlist migration)

### Filters
- By plan, country, status, date range
- Search by name, email, phone

---

## 4. Revenue (/admin/revenue)

- MRR trend (monthly)
- Revenue by plan
- Revenue by payment provider (Paystack/Stripe/PayPal)
- Revenue by country
- All transactions list (table)
- Failed payments list
- Churn: cancelled subscriptions this month

---

## 5. Waitlist (/admin/waitlist)

- All waitlist entries (table)
- Stats: total, by country, by business type, by pricing willingness
- Top problems (ranked)
- Beta testers count and list
- **Actions:**
  - Export CSV
  - **Migrate All** → creates user accounts with temp passwords
  - **Migrate Selected**
  - **Send Launch Notification** (email + WhatsApp)

---

## 6. System (/admin/system)

- Environment check: which services are configured
- Database stats: total rows per table, storage used
- API health: test connections to Turso, Redis, Groq, Paystack
- Feature flags: toggle features on/off
- Error log: recent errors (from console/DB)
- Cron job status: last run times

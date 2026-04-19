# Migration Plan
# CHATEVO — Waitlist → Live App

---

## Overview

When the app is ready (end of Week 8), migrate all waitlist signups from InfinityFree MySQL to Turso + Clerk.

---

## Steps

### Step 1: Export from InfinityFree
- Login to InfinityFree phpMyAdmin
- Export `waitlist` table as CSV
- Download to local machine

### Step 2: Import to Admin Panel
- Login to Chatevo admin: `app.chatevo.io/admin`
- Go to `/admin/waitlist`
- Click "Import CSV"
- Upload the CSV file
- System saves to `waitlist` table in Turso

### Step 3: Bulk Create Accounts
- Click "Migrate All" (or select specific entries)
- For each waitlist entry:
  - Create Clerk user (email + temporary password)
  - Create organization in Turso
  - Create user record linked to Clerk
  - Set `plan = 'trial'`, `trial_ends_at = 14 days`
  - Generate `referral_code`
  - Mark waitlist entry as migrated

### Step 4: Send Launch Notifications

#### Email (via Resend):
**Subject:** 🚀 Chatevo is LIVE! Your WhatsApp store is ready.

Hi {name},

Remember when you joined our waitlist? You were #{number}.

Today, your WhatsApp store is READY.

🔑 **Login:** `https://app.chatevo.io/sign-in`
📧 **Email:** {email}
🔐 **Temp Password:** {temp_password}

⚠️ *Please change your password after login!*

🎁 As an early supporter, use code **EARLY30** for 30% off FOREVER.

Start selling on WhatsApp in 5 minutes:
1. Login
2. Add your products
3. Connect WhatsApp
4. Share your store link

Let's go! 🚀
— {founder_name}, Founder of Chatevo

#### WhatsApp (via Meta API / personal):
🚀 **Chatevo is LIVE!**

Hi {name}! Your WhatsApp store is ready.

**Login:** `app.chatevo.io`
**Password:** {temp_password}
(Change it after login!)

🎁 **30% OFF** forever — code: **EARLY30**

[🚀 Login Now] [❓ Need Help?]

### Step 5: First Login Experience
1. User logs in with temp password
2. Clerk forces password change
3. Redirect to `/onboarding` (if no org exists)
4. Onboarding wizard: name → country → business type
5. Redirect to `/dashboard`
6. Dashboard shows "Welcome! Let's set up your store" banner
7. Guided steps: Add product → Connect WhatsApp → Set up payments

---

## Timeline
- **Day 1:** Export + import + bulk create accounts
- **Day 1:** Send launch emails (batch of 100/hour)
- **Day 2:** Send WhatsApp messages (batch of 50/hour)
- **Day 2-3:** Monitor signups, fix issues
- **Day 3:** Send follow-up to non-openers
- **Day 7:** Send reminder to non-activated accounts

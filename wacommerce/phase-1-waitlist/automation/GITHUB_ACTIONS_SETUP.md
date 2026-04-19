# ⚙️ Chatevo Marketing Hub - GitHub Actions Setup Guide

In order for the automated marketing scripts (Cold Emails, FaceBook Posts, and DB maintenance) to run unattended completely in the cloud, you need to add the following **Repository Secrets** to your GitHub repository.

## 📌 How to Add Secrets to GitHub

1. Go to your GitHub repository in your browser: `https://github.com/criminal-killer/wcp-main`
2. Click on **Settings** (the gear icon at the top).
3. On the left sidebar, scroll down to **Security** and click **Secrets and variables** -> **Actions**.
4. Click the green button labelled **New repository secret**.
5. Add each of the secrets listed below one by one.

---

## 🔑 Required Secrets List

### Database Connection (Turso)
*Used to pull approved leads to contact, fetch marketing posts, and mark items as "SENT" or "POSTED".*
- **`TURSO_DATABASE_URL`**: Your Turso database connection URL (e.g. `libsql://your-db-name.turso.io`)
- **`TURSO_AUTH_TOKEN`**: The authentication token for your Turso DB.

### Cold Email SMTP (Brevo or Gmail)
*Used by the weekday Cron job to email local businesses across Kenya's 47 counties safely from your domain.*

Since the script limits sending to 80 emails per day, you have two great free options. 

#### Option 1: Your Own Gmail Account (Easiest)
You can use a regular `@gmail.com` address. Google gives you 500 free SMTP sends a day.
1. Turn on **2-Step Verification** for your Google Account.
2. Search for **App Passwords** in your Google Account security settings.
3. Generate a new App Password (it'll be a 16-character string).
4. Add these credentials to your GitHub secrets:
   - **`SMTP_HOST`**: `smtp.gmail.com`
   - **`SMTP_PORT`**: `587`
   - **`SMTP_USER`**: Your full Gmail address.
   - **`SMTP_PASS`**: The 16-character App Password you generated (no spaces).
   - **`FROM_EMAIL`**: Your Gmail address.

#### Option 2: Brevo (Most Professional)
For the highest deliverability and a generous free tier (300 emails/day), **Brevo (formerly Sendinblue)** is highly recommended if you own a custom domain (like `@chatevo.io`). You get an SMTP key immediately upon signing up and verifying it.
1. Go to [https://brevo.com](https://brevo.com) and create a free account.
2. In the top right dropdown menu under your profile name, click **SMTP & API**.
3. Click the **SMTP** tab.
4. Click **Generate a new SMTP key**, name it "GitHub Actions", and copy the generated credentials.
5. Add these strict credentials to your GitHub secrets:
   - **`SMTP_HOST`**: `smtp-relay.brevo.com`
   - **`SMTP_PORT`**: `587`
   - **`SMTP_USER`**: The login email value shown on the Brevo SMTP page.
   - **`SMTP_PASS`**: The long API key/password you just generated.
   - **`FROM_EMAIL`**: The email address attached to your verified Brevo domain.

*(Optional default variable via code: `WAITLIST_URL` exists but if you don't add it to secrets, it defaults correctly to your frontend vercel app string `https://chatevo-app.vercel.app`)*

### Social Media (Facebook Pages API)
*Used by the daily Cron job to fetch approved AI-generated posts from your DB and publish them natively directly onto your Facebook Page.*
- **`FACEBOOK_PAGE_ID`**: The numeric ID string of your Facebook business page.
- **`FACEBOOK_ACCESS_TOKEN`**: A permanent Page Access Token generated from the Facebook Developer Portal with `pages_manage_posts` and `pages_read_engagement` permissions.

---

## 🕒 How does everything run?

Once these secrets are in place, you don't need to do anything manually!

1. **Every Weekday at 14:00 UTC**: The Cold Email script triggers. It will chunk through Kenyan counties on OpenStreetMap, insert the missing contacts into Turso, then pull up to 80 `APPROVED` leads and email them, transitioning them to `SENT`.
2. **Every Day at 13:00 UTC**: The Social Media script triggers. It pulls any ready-to-go `APPROVED` text+image records from your `marketing_posts` table and posts them to your Facebook audience, marking them as `POSTED`.
3. **Every Midnight UTC**: The Marketing Janitor script cleans up stale `PENDING` posts and keeps the DB neat and performant.

If an action fails, you'll receive an email from GitHub notifyting you of the failure, normally due to a bad access token so you can investigate and rotate!

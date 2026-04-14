# ⚙️ Sella Marketing Hub - GitHub Actions Setup Guide

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

### Cold Email SMTP (Brevo Recommended)
*Used by the weekday Cron job to email local businesses across Kenya's 47 counties safely from your domain.*

For the highest deliverability and a generous free tier, **Brevo (formerly Sendinblue)** is highly recommended. It offers 300 free emails per day, which perfectly covers our script's maximum limit of 80 emails per run. If you have a custom domain and want the emails to look extremely professional right off the bat, Brevo is the absolute best free tier for marketing. You get an SMTP key immediately upon signing up and verifying it.

**Step-by-step Setup for Brevo:**
1. Go to [https://brevo.com](https://brevo.com) and create a free account.
2. In the top right dropdown menu under your profile name, click **SMTP & API**.
3. Click the **SMTP** tab.
4. Click **Generate a new SMTP key**, name it "GitHub Actions", and copy the generated credentials.
5. Add those credentials to your GitHub secrets using these strict values:
   - **`SMTP_HOST`**: `smtp-relay.brevo.com`
   - **`SMTP_PORT`**: `587`
   - **`SMTP_USER`**: The login email value shown on the Brevo SMTP page.
   - **`SMTP_PASS`**: The long API key/password you just generated.
   - **`FROM_EMAIL`**: The email address attached to your verified Brevo domain (e.g., `hello@sella.io`).

*(Optional default variable via code: `WAITLIST_URL` exists but if you don't add it to secrets, it defaults correctly to your frontend vercel app string `https://sella-app.vercel.app`)*

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

# SELLA: WhatsApp Commerce Platform 🛍️📱

Welcome to the **Sella Platform**! This monorepo contains the entire suite for the WhatsApp Commerce application. The various services have also been synced to their own repositories for independent deployment tracking.

## 🔗 Project Links

* **Main Repository (Monorepo)**: [wcp-main](https://github.com/criminal-killer/wcp-main)
* **Phase 2 App (The Core WhatsApp Bot & Store API)**: [Phase-2-app](https://github.com/criminal-killer/Phase-2-app)
* **Admin Panel (Management Dashboard)**: [adm-pan](https://github.com/criminal-killer/adm-pan)

## 🚀 Deployment (Vercel)

Both the Phase 2 App and Admin Panel are structured as standard Next.js applications and are ready to be imported into Vercel.

**Steps to Deploy:**
1. Log into Vercel and click **Add New > Project**.
2. Select your `Phase-2-app` repository for the main app, and `adm-pan` repository for your Admin Panel.
3. Configure your Environment Variables exactly as they appear in your local `.env.local` files.
   * Make sure to set `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` accurately in Phase-2-App.
4. Click **Deploy**.

## ⚙️ Automations (GitHub Actions)

This primary repository (`wcp-main`) is equipped with automated workflows located in `.github/workflows`:
* `cold-email-weekday.yml`: Automates cold outreach pipelines.
* `comment-bot.yml`: Pre-configured automation for community engagement.
* `social-media-daily.yml`: Schedules daily social media broadcasts.

The automations are fully intact and ready to maintain your growth channels. 

---
*Built for scale and simplicity.*

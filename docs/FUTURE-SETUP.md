# 🚀 Sella Platform: Future Expansion & Setup Guide

This document outlines the steps required to transition the platform from the current Vercel production URL to a custom domain (Cloudflare) and how to implement Upstash Redis for advanced features.

---

## 🌩️ 1. Custom Domain Setup (Cloudflare)

To move from `sella-app.vercel.app` to a custom domain like `sella.app`:

### Step A: Configure Cloudflare DNS
1. Add your site to Cloudflare.
2. Update your domain's nameservers at your registrar to point to Cloudflare.
3. In Cloudflare DNS, ensure `A`, `AAAA`, or `CNAME` records point to Vercel's edge nodes (as specified in Vercel's "Domains" settings).

### Step B: Update Vercel Settings
1. Go to **Vercel Dashboard → Settings → Domains**.
2. Add your new domain (e.g., `sella.app`).
3. Vercel will provide the DNS records needed; verify they match Cloudflare.

### Step C: Update Environment Variables
You must update the following variables in the Vercel dashboard and re-deploy:
- `NEXT_PUBLIC_APP_URL=https://sella.app`
- `RESEND_FROM_EMAIL=Sella <onboarding@sella.app>` (after verifying your domain in Resend)

---

## 🗄️ 2. Upstash Redis Integration

The platform is designed to use Redis for:
- WhatsApp session state management.
- AI conversation memory (context).
- Rate limiting for API routes.

### Step A: Provisioning
1. Go to [Upstash Console](https://console.upstash.com).
2. Create a new **Redis** database (Global or Regional).
3. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### Step B: Configuration
Add these to your Vercel Environment Variables:
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AX...
```

### Step C: Current Usage
The code in `lib/redis.ts` is already configured to use these variables if present. If they aren't provided, the platform defaults to a local memory cache (not persistent across serverless invocations). Adding Upstash is highly recommended for production reliability.

---

## 📧 3. Professional Email Setup (Resend)

Currently, the platform uses `onboarding@resend.dev`. To use a branded email:
1. Verify your custom domain in the **Resend Dashboard → Domains**.
2. Add the provided `MX` and `TXT` records to Cloudflare.
3. Update `RESEND_FROM_EMAIL` in Vercel to `Sella <hello@sella.app>`.

---

## 🛠️ 4. Maintenance & Scaling

- **Database**: Monitor Turso usage. The free tier covers up to 1B rows/month (plentiful for now).
- **AI**: The current Groq model (`llama-3.3-70b-versatile`) is optimal for speed and cost.
- **Support**: All inquiries should be directed to `mazaoedu@gmail.com`.

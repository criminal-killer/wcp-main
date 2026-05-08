# Domain Switch Guide

This is a living checklist for moving Chatevo from the initial Vercel subdomains to a custom production domain.

## Current State (Pre-Domain)
- **Merchant App:** `https://chatevo-app.vercel.app`
- **Admin App:** `https://admin-chatevo.vercel.app`

## Migration Steps (When you buy a domain)

Follow these exact steps when migrating to your custom domain (e.g., `chatevo.io`).

### 1. Vercel Configuration
- Go to the **Merchant** project settings in Vercel.
- Under **Domains**, add your custom domain (e.g., `app.chatevo.io` or `chatevo.io`).
- Go to the **Admin** project settings in Vercel.
- Under **Domains**, add your custom admin domain (e.g., `admin.chatevo.io`).

### 2. Environment Variables
Update the following environment variables in both Vercel projects (and your local `.env`):
- `NEXT_PUBLIC_APP_URL` -> e.g., `https://app.chatevo.io`
- `NEXT_PUBLIC_ADMIN_URL` -> e.g., `https://admin.chatevo.io`

### 3. Clerk Authentication
- Log into the Clerk Dashboard.
- Under **Settings > Domains & URLs**, update your application domain.
- Update **Allowed Origins** (CORS) to include your new domain(s).
- Update the **Redirect URLs** (sign-in, sign-up, post-auth redirects) to point to the new domain.
- Update the **Clerk Webhook Endpoint** URL to point to `https://<YOUR_NEW_MERCHANT_DOMAIN>/api/webhooks/clerk`.

### 4. Payment & Platform Webhooks
Update all external services to send webhooks to your new domain:
- **Paystack:** Update the webhook URL to `https://<YOUR_NEW_MERCHANT_DOMAIN>/api/webhooks/paystack`
- **Stripe:** (If enabled) Update the webhook URL in the Stripe Developer Dashboard.
- **WhatsApp / Meta:** 
  - Go to your Meta App Dashboard > WhatsApp > Configuration.
  - Update the **Callback URL** to `https://<YOUR_NEW_MERCHANT_DOMAIN>/api/webhook`
  - Re-verify using the token found in `NEXT_PUBLIC_WA_WEBHOOK_VERIFY_TOKEN`.

### 5. Resend (Email Deliverability)
- Go to the Resend Dashboard > Domains.
- Add and verify your new custom domain by updating your DNS records.
- In Vercel, update the `RESEND_FROM_EMAIL` environment variable to use your verified domain (e.g., `security@chatevo.io`).
  *(This removes the fallback `onboarding@resend.dev` sender).*

### 6. Cookies & Sessions
- Currently, cookies do not hardcode a specific domain. If you ever explicitly set `Domain=.chatevo.io` in your cookies, ensure that is updated. Otherwise, no changes are needed.

---

**Note:** When adding new integrations, update this document if they depend on the application URL or domain.

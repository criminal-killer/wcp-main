# Chatevo API Setup Guide

This guide provides step-by-step instructions for configuring all required external services for the Chatevo WhatsApp Commerce Platform.

---

## 1. Authentication (Clerk)
1. Go to [Clerk.com](https://clerk.com) and create a new application.
2. Select **Email** and **Password** (and optionally Google) as sign-in methods.
3. In **API Keys**, copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. In **Webhooks**, create an endpoint pointing to `https://your-domain.com/api/webhooks/clerk` with `user.created` and `user.deleted` events. Copy the `CLERK_WEBHOOK_SECRET`.

## 2. Database (Turso)
1. Sign up at [Turso.tech](https://turso.tech).
2. Create a new database named `chatevo-db`.
3. Run `turso db show chatevo-db` to get the `TURSO_DATABASE_URL`.
4. Run `turso db tokens create chatevo-db` to get the `TURSO_AUTH_TOKEN`.

## 3. WhatsApp / Meta (Developer Console)
1. Sign up at [Meta for Developers](https://developers.facebook.com).
2. Create a **Business App** and add the **WhatsApp** product.
3. In **WhatsApp > Getting Started**, add a test phone number.
4. Copy the **Phone Number ID** (for store settings).
5. Generate a **Permanent Access Token** in your Meta Business Suite.
6. Set `WHATSAPP_VERIFY_TOKEN` to a random secret string of your choice.
7. Configure the webhook in Meta dashboard: `https://your-domain/api/webhook` with the verify token you set.

## 4. AI (Groq)
1. Sign up at [Groq Cloud](https://console.groq.com).
2. Create an API Key and copy it as `GROQ_API_KEY`.
3. Model used: `llama-3.1-70b-versatile`.

## 5. Payments (SaaS Billing)

### Paystack (Africa)
1. Register at [Paystack.com](https://paystack.com).
2. En Settings > API Keys, copy `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`.
3. Set `PAYSTACK_WEBHOOK_SECRET` from the Webhooks tab.

### Stripe (Global)
1. Sign up at [Stripe.com](https://stripe.com).
2. In **Developers > API Keys**, copy `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`.
3. Create a Product named "Chatevo Starter" and copy the **Price ID** as `STRIPE_STARTER_PRICE_ID`.
4. Set up a webhook at `https://your-domain/api/payments/webhook/stripe`.

### PayPal
1. Go to [PayPal Developer](https://developer.paypal.com).
2. Create a **REST API app** in Live mode.
3. Copy `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.

## 6. Email (Resend)
1. Sign up at [Resend.com](https://resend.com).
2. Create an API Key as `RESEND_API_KEY`.
3. Verify your domain (e.g., `chatevo.io`) to send from `noreply@chatevo.io`.

## 7. Cache (Upstash)
1. Sign up at [Upstash.com](https://console.upstash.com).
2. Create a **Redis** database.
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## Security Checklist
- [ ] Ensure `ENCRYPTION_KEY` is a 32-character random string.
- [ ] Set `ADMIN_USER_ID` to your Clerk User ID (found in Clerk dashboard).
- [ ] Set `CRON_SECRET` to a secure random string for Vercel Cron jobs.

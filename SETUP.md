# Chatevo Setup Guide

Everything you need to configure before running or deploying Chatevo.

---

## 1. Environment Variables

### Critical (Required for app to function)

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `TURSO_DATABASE_URL` | Turso Dashboard → Database → Connect | `.env.local` (merchant + admin) | Format: `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso Dashboard → Database → Tokens | `.env.local` (merchant + admin) | Create a token with read/write access |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | `.env.local` (merchant + admin) | Starts with `pk_live_` or `pk_test_` |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | `.env.local` (merchant + admin) | Starts with `sk_live_` or `sk_test_` |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Signing Secret | `.env.local` (merchant) | Starts with `whsec_` |

### Required After P0 Security Fixes

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `OTP_HMAC_SECRET` | Generate yourself | `.env.local` (merchant) | Run: `openssl rand -hex 32`. **Required** — OTP routes crash without it |
| `CRON_SECRET` | Generate yourself | `.env.local` (merchant) | Run: `openssl rand -hex 32`. **Required** — cron endpoints return 500 without it |

### Payments

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard → Settings → API Keys | `.env.local` (merchant) | Starts with `sk_live_` or `sk_test_` |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack Dashboard → Settings → Webhooks | `.env.local` (merchant) | Used for signature verification |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | `.env.local` (merchant) | Starts with `sk_live_` or `sk_test_` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | `.env.local` (merchant) | Starts with `whsec_` |

### AI

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `GROQ_API_KEY` | Groq Console → API Keys | `.env.local` (merchant) | Default AI provider (Llama 3.3 70B) |

### Email

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `RESEND_API_KEY` | Resend Dashboard → API Keys | `.env.local` (merchant) | For OTP emails and notifications |
| `RESEND_FROM_EMAIL` | Resend Dashboard → Domains | `.env.local` (merchant) | Format: `Chatevo <noreply@yourdomain.com>` |

### Redis

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `KV_REST_API_URL` | Upstash Dashboard → REST API | `.env.local` (merchant) | For cart and flow state |
| `KV_REST_API_TOKEN` | Upstash Dashboard → REST API | `.env.local` (merchant) | |

### WhatsApp

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `WHATSAPP_APP_SECRET` | Meta Business → App Settings → Basic | `.env.local` (merchant) | **Required** for webhook signature verification |

### App Config

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | `.env.local` (merchant) | Used in emails and webhook redirect URLs |

### Admin App

| Variable | Where to Find | Where to Add | Notes |
|----------|---------------|--------------|-------|
| `SUPER_ADMIN_EMAIL` | Choose yourself | `.env.local` (admin) | Admin login email |
| `SUPER_ADMIN_PASSWORD` | Choose yourself | `.env.local` (admin) | Admin login password — **store securely** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard | `.env.local` (admin) | Same or separate Clerk app |
| `CLERK_SECRET_KEY` | Clerk Dashboard | `.env.local` (admin) | Same or separate Clerk app |

---

## 2. Sync Environment Variables

After creating `.env.local` files, sync them:

```bash
# From project root
npm run sync-env
```

This copies root `.env.local` to both `apps/merchant/.env.local` and `apps/admin/.env.local`.

---

## 3. Database Setup

### Push Schema

```bash
npm run db:push
```

### Run Migrations (if needed)

```bash
# From project root
npx tsx scripts/apply-sql.mjs scripts/migrate-audit-logs.sql
npx tsx scripts/apply-sql.mjs scripts/migrate-referrals.sql

# Merchant-specific
cd apps/merchant
npx tsx scripts/migrate-error-logs.ts
```

---

## 4. Clerk Setup

1. Create a Clerk application at https://dashboard.clerk.com
2. Enable Email/Password and Google OAuth (or your preferred providers)
3. Set up a webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy API keys and webhook secret to `.env.local`

---

## 5. Paystack Setup

1. Create a Paystack account at https://dashboard.paystack.com
2. Go to Settings → API Keys → Copy Secret Key
3. Go to Settings → Webhooks → Add webhook URL: `https://your-domain.com/api/payments/webhook/paystack`
4. Copy the webhook secret to `.env.local`

---

## 6. Redis Setup (Upstash)

1. Create an Upstash account at https://console.upstash.com
2. Create a Redis database
3. Copy the REST API URL and Token to `.env.local`

---

## 7. WhatsApp Cloud API Setup

1. Create a Meta Business account
2. Set up WhatsApp Cloud API
3. Configure webhook URL: `https://your-domain.com/api/webhook`
4. Verify token and copy App Secret to `.env.local`

---

## 8. Local Development

```bash
# Install dependencies
npm install

# Start merchant app
npm run dev:merchant   # http://localhost:3000

# Start admin app
npm run dev:admin      # http://localhost:3001
```

---

## 9. Build & Deploy

```bash
# Type check
npm run typecheck

# Build merchant
npm run build:merchant

# Build admin
npm run build:admin
```

Deploy to Vercel:
- Merchant: `apps/merchant` → `chatevo-app.vercel.app`
- Admin: `apps/admin` → `admin-chatevo.vercel.app`

---

## 10. Post-Deployment Checklist

- [ ] All env vars set in Vercel dashboard (not just `.env.local`)
- [ ] `OTP_HMAC_SECRET` set (required after P0 fixes)
- [ ] `CRON_SECRET` set (required after P0 fixes)
- [ ] `WHATSAPP_APP_SECRET` set (webhook signature verification)
- [ ] Clerk webhook configured and receiving events
- [ ] Paystack webhook configured and receiving events
- [ ] Stripe webhook configured (if using Stripe)
- [ ] Cron jobs configured in Vercel for `/api/cron/expire-trials` and `/api/cron/payouts`
- [ ] Test WhatsApp connection from Settings page
- [ ] Test OTP flow (send + verify)
- [ ] Test checkout flow end-to-end

---

*Last updated: 2026-05-24*

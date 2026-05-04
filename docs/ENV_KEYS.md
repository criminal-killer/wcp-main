# Environment Variable Reference

All variables needed to run the Chatevo monorepo locally and in production.  
Copy `.env.example` → `.env.local` (never commit `.env.local`).  
Run `node scripts/sync-env.mjs` to propagate root `.env.local` into each app.

---

## Turso (Database)

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `TURSO_DATABASE_URL` | merchant, admin | [turso.tech](https://turso.tech) → Create DB → URL | Format: `libsql://name.turso.io` |
| `TURSO_AUTH_TOKEN` | merchant, admin | Turso dashboard → DB → Tokens | **SECRET** — rotate if leaked |

---

## Clerk (Authentication)

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | merchant, admin | [clerk.com](https://clerk.com) → API Keys | Public — safe in browser |
| `CLERK_SECRET_KEY` | merchant, admin | Clerk → API Keys | **SECRET** |
| `CLERK_WEBHOOK_SECRET` | merchant | Clerk → Webhooks → Signing Secret | **SECRET** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | merchant | — | Default: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | merchant | — | Default: `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | merchant | — | Default: `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | merchant | — | Default: `/onboarding` |
| `ADMIN_USER_ID` | admin | Clerk → Users → copy User ID | Grants superadmin access |

---

## WhatsApp / Meta

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `WHATSAPP_VERIFY_TOKEN` | merchant | You choose this string | Must match Meta webhook config |
| `WHATSAPP_APP_SECRET` | merchant | Meta Developers → App → Settings → Basic | **SECRET** |

---

## Payments — Stripe (Global)

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `STRIPE_SECRET_KEY` | merchant | [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API Keys | **SECRET** |
| `STRIPE_PUBLISHABLE_KEY` | merchant | Stripe → API Keys | Public |
| `STRIPE_WEBHOOK_SECRET` | merchant | Stripe → Webhooks → Signing Secret | **SECRET** |
| `STRIPE_STARTER_PRICE_ID` | merchant | Stripe → Products → create $29/mo price | Optional — auto-created if missing |
| `STRIPE_PRO_PRICE_ID` | merchant | Stripe → Products → create $59/mo price | Optional |
| `STRIPE_ELITE_PRICE_ID` | merchant | Stripe → Products → create $99/mo price | Optional |

> **Note:** PayPal has been removed from this platform. Do not add PayPal env vars.

---

## Payments — Paystack (Africa / Local Cards)

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `PAYSTACK_SECRET_KEY` | merchant | [paystack.com](https://paystack.com) → Settings → API | **SECRET** |
| `PAYSTACK_PUBLIC_KEY` | merchant | Paystack → API | Public |
| `PAYSTACK_WEBHOOK_SECRET` | merchant | Paystack → Settings → Webhooks | **SECRET** |
| `PAYSTACK_STARTER_PLAN_CODE` | merchant | Paystack → Plans → create $29/mo | Optional |
| `PAYSTACK_PRO_PLAN_CODE` | merchant | Paystack → Plans → create $59/mo | Optional |
| `PAYSTACK_ELITE_PLAN_CODE` | merchant | Paystack → Plans → create $99/mo | Optional |

---

## AI

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `GROQ_API_KEY` | merchant | [console.groq.com](https://console.groq.com) | Default Chatevo AI (free tier) |
| `GOOGLE_GEMINI_API_KEY` | merchant | [aistudio.google.com](https://aistudio.google.com) | Pro/Elite plans |

---

## Cache

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `UPSTASH_REDIS_REST_URL` | merchant | [console.upstash.com](https://console.upstash.com) | Rate limiting, sessions |
| `UPSTASH_REDIS_REST_TOKEN` | merchant | Upstash → Database → Token | **SECRET** |

---

## Email

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `RESEND_API_KEY` | merchant | [resend.com](https://resend.com) → API Keys | **SECRET** |
| `EMAIL_FROM_DOMAIN` | merchant | Your verified Resend domain | e.g. `chatevo.io` |

---

## File Storage

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `BLOB_READ_WRITE_TOKEN` | merchant | Vercel → Storage → Blob | Auto-set in Vercel deployments |

---

## Security

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `ENCRYPTION_KEY` | merchant | `openssl rand -hex 16` | 32-char AES-256 key — **SECRET, rotate if leaked** |
| `OTP_HMAC_SECRET` | merchant | `openssl rand -base64 32` | Signs OTP cookies — **SECRET** |
| `SUPER_ADMIN_JWT_SECRET` | admin | `openssl rand -base64 32` | Admin backdoor JWT — **SECRET** |
| `CRON_SECRET` | merchant | Any random string | Protects cron endpoints |

---

## App Config

| Variable | Required By | Where to Get | Notes |
|----------|------------|--------------|-------|
| `NEXT_PUBLIC_APP_URL` | merchant | Your deployment URL | e.g. `https://app.chatevo.io` |
| `NEXT_PUBLIC_APP_NAME` | merchant | — | Default: `Chatevo` |

---

## Vercel Project Configuration

| App | Vercel Root Directory | Build Command | Output Directory |
|-----|----------------------|---------------|-----------------|
| Merchant | `.` (repo root) | `next build` | `.next` |
| Admin | `wacommerce/admin-panel` | `next build` | `.next` |

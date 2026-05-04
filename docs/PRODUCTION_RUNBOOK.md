# Production Deployment Runbook

This runbook outlines the operational steps required to deploy, configure, and verify the Chatevo platform in a production environment.

## 1. Repository Architecture

Chatevo is structured as a monorepo containing two Next.js applications: the Merchant app (`apps/merchant`), which serves the main SaaS product and public-facing endpoints, and the Admin app (`apps/admin`), which provides an internal dashboard for platform management. The monorepo also utilizes shared packages (`packages/db` and `packages/shared`) to ensure consistency in data models, schemas, and utility functions across both applications.

## 2. Vercel Setup

The platform requires two separate Vercel projects, one for each application.

### Merchant Project
- **Root Directory:** `apps/merchant`
- **Framework Preset:** Next.js
- **Install Command:** `npm install`
- **Build Command:** `npm run build`

### Admin Project
- **Root Directory:** `apps/admin`
- **Framework Preset:** Next.js
- **Install Command:** `npm install`
- **Build Command:** `npm run build`

## 3. Environment Variables

Reference `docs/ENV_KEYS.md` as the authoritative source of truth for all environment variables. Ensure the following keys are populated in your production Vercel projects.

### Checklist by Category

**Clerk (Authentication)**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Merchant & Admin)
- `CLERK_SECRET_KEY` (Merchant & Admin)
- `CLERK_WEBHOOK_SECRET` (Merchant only)

**Turso (Database)**
- `TURSO_DATABASE_URL` (Merchant & Admin)
- `TURSO_AUTH_TOKEN` (Merchant & Admin)

**Upstash (Redis / Rate Limiting)**
- `UPSTASH_REDIS_REST_URL` (Merchant & Admin)
- `UPSTASH_REDIS_REST_TOKEN` (Merchant & Admin)

**Stripe (Payments)**
- `STRIPE_SECRET_KEY` (Merchant only)
- `STRIPE_WEBHOOK_SECRET` (Merchant only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Merchant only)

**Paystack (Payments)**
- `PAYSTACK_SECRET_KEY` (Merchant only)
- `PAYSTACK_WEBHOOK_SECRET` (Merchant only)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (Merchant only)

**Resend (Email)**
- `RESEND_API_KEY` (Merchant & Admin)

**Meta / WhatsApp (Messaging)**
- `WHATSAPP_TOKEN` (Merchant only)
- `WHATSAPP_PHONE_ID` (Merchant only)
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (Merchant only)

**Security & Platform Admin**
- `ENCRYPTION_KEY` (Merchant & Admin)
- `OTP_HMAC_SECRET` (Merchant only)
- `CRON_SECRET` (Merchant only)
- `SUPER_ADMIN_JWT_SECRET` (Admin only)
- `ADMIN_USER_ID` (Admin only)

## 4. Webhook Configuration

After the **Merchant app** is deployed, you must configure the following external webhooks to point to your production domain (e.g., `https://chatevo.app`).

### Clerk Webhook
- **URL:** `https://chatevo.app/api/webhooks/clerk`
- **Events:** `user.created`, `user.updated`, `user.deleted`
- **Verification:** Set the signing secret in Vercel as `CLERK_WEBHOOK_SECRET`. Check the Clerk dashboard logs for successful deliveries.

### Stripe Webhook
- **URL:** `https://chatevo.app/api/payments/webhook/stripe`
- **Events:** `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- **Verification:** Set the signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`. Trigger a test checkout and ensure the platform reflects the subscription status.

### Paystack Webhook
- **URL:** `https://chatevo.app/api/payments/webhook/paystack`
- **Events:** `charge.success`, `subscription.disable`, `subscription.not_renew`
- **Verification:** Set your webhook URL in the Paystack dashboard. Ensure your `PAYSTACK_SECRET_KEY` in Vercel matches your dashboard. Check Paystack webhook logs.

### WhatsApp Webhook
- **URL:** `https://chatevo.app/api/webhook/whatsapp`
- **Events:** `messages`
- **Verification:** Enter the `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in the Meta developer portal to verify ownership. Send a test WhatsApp message to the connected number.

## 5. Database Migrations

Production schema updates are handled safely using the idempotent apply script without requiring the Turso CLI.

1. **Run Migrations:** Execute the migration script locally (or in CI) targeting production:
   ```bash
   node --env-file=.env.production scripts/apply-sql.mjs scripts/migrate-referrals.sql
   ```
2. **Idempotency:** The script parses the SQL, strips comments, and executes statements sequentially. It automatically skips statements that throw safe duplication errors (e.g., "duplicate column name", "already exists"), ensuring it can be rerun safely.
3. **Verification:** Run `node scripts/verify-schema.mjs` to ensure your production Turso database matches the expected codebase schema.

## 6. Post-Deploy Smoke Tests

After a successful deployment, run these manual checks against the production URLs to ensure system health.

| URL / Action | Expected Outcome |
|--------------|------------------|
| `https://chatevo.app/` | Loads the public marketing site without errors. |
| `https://chatevo.app/sign-in` | Redirects to the Clerk login flow. |
| `https://admin.chatevo.app/` | Loads the Admin dashboard login screen. |
| `https://chatevo.app/api/webhook/whatsapp` (GET) | Returns a `400 Bad Request` or unauthorized message (confirming the endpoint is live and expecting Meta's challenge token). |

## 7. Rollback Plan

If a critical issue is discovered post-deployment, follow these steps to revert to a stable state.

### Vercel Rollback (Immediate Application Revert)
1. Navigate to the affected project in the Vercel Dashboard.
2. Go to the **Deployments** tab.
3. Locate the last known good deployment.
4. Click the options menu (`...`) and select **Instant Rollback**.
5. *Note: This restores the previous code and environment variables immediately without rebuilding.*

### Git Rollback (Source Control Revert)
If the bad code was merged into the `main` branch, revert it in version control to ensure the next deployment doesn't reintroduce the bug:
1. Locally revert the broken commit or merge:
   ```bash
   git revert <bad-commit-hash>
   ```
2. Push the reverted commit to the main branch:
   ```bash
   git push origin main
   ```
3. Vercel will automatically build and deploy the newly reverted state.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Chatevo** is a multi-tenant WhatsApp Commerce SaaS platform built as a Next.js 14 monorepo with two deployable apps sharing a single Turso/libSQL database.

- **Merchant App** → `https://chatevo-app.vercel.app` (apps/merchant)
- **Admin App** → `https://admin-chatevo.vercel.app` (apps/admin)
- **Shared DB** → Turso via libSQL + Drizzle ORM (schema lives at `apps/merchant/lib/schema.ts`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Turso libSQL + Drizzle ORM |
| Auth | Clerk (merchant + admin middleware) |
| Payments | Paystack (Africa/M-Pesa), Stripe (SaaS subscriptions) |
| AI | Groq (Llama), Google Gemini, OpenAI-compatible |
| Cache | Upstash Redis |
| Email | Resend |
| Deployment | Vercel (2 separate projects) |

## Build Commands

```bash
# TypeScript check (all workspaces)
npm run typecheck

# Build merchant app
npm run build:merchant

# Build admin app
npm run build:admin

# Push DB schema (merchant)
npm run db:push

# Local development
npm run dev:merchant   # http://localhost:3000
npm run dev:admin       # http://localhost:3001
```

## Architecture

### Apps
- `apps/merchant` — Merchant-facing: landing page, dashboard, store pages, AI chat bot, webhooks
- `apps/admin` — Platform admin: users, affiliates, revenue, system logs, tickets

### Key Libraries
- `apps/merchant/lib/schema.ts` — **Canonical Drizzle schema** (organizations, users, products, orders, etc.)
- `apps/merchant/lib/db.ts` — Lazy Turso client using proxy pattern (defers init until first request)
- `apps/merchant/lib/store-engine.ts` — WhatsApp bot engine: processes incoming messages, manages cart flow, calls AI
- `apps/merchant/lib/whatsapp.ts` — WhatsApp API helpers (sendTextMessage, sendInteractiveButtonMessage, etc.)
- `apps/merchant/lib/payments.ts` — Paystack/Stripe helpers, subscription creation, plan normalization
- `apps/merchant/lib/email.ts` — Resend email client (graceful no-op when RESEND_API_KEY missing)
- `apps/merchant/lib/redis.ts` — Cart and flow state management via Upstash
- `apps/merchant/lib/encryption.ts` — AES-256-CBC encryption for WhatsApp tokens, payment keys

### Schema Notes
- `organizations` table holds the merchant account with `wa_*` fields (WhatsApp phone number, access token)
- All merchant data is scoped by `org_id` — always include `eq(orders.org_id, user.org_id)` in queries
- `contacts` table = end customers (identified by WhatsApp phone number)
- `orders` stores cart items as JSON string in `items` field
- `audit_logs` table (for admin) tracks admin actions

### Multi-Tenant Pattern
Every DB query must scope to the user's `org_id`:
```typescript
const order = await db.select().from(orders)
  .where(and(eq(orders.id, orderId), eq(orders.org_id, user.org_id)))
```

### Webhooks
- `/api/webhook` — WhatsApp incoming messages (Meta Cloud API)
- `/api/payments/webhook/paystack` — Payment confirmations
- `/api/payments/webhook/stripe` — Subscription events
- `/api/webhooks/clerk` — User sync events
- All webhook routes verify signatures (Paystack HMAC, Stripe constructEvent, Clerk svix, Meta x-hub-signature-256)

### AI Chat Flow
1. Incoming WhatsApp message → `processIncomingMessage()` in store-engine.ts
2. Checks Redis for cart/flow state
3. Routes through flow states: main_menu → browsing_categories → browsing_products → cart → delivery_info → payment_select
4. Falls back to AI via `/api/ai/chat` (Groq Llama by default, or custom provider)
5. Custom greeting loaded from `ai_system_prompt` field (first line)

### Plan/Price Constants
`apps/merchant/lib/payments.ts` exports `PLAN_CONFIG` with correct prices ($29/$59/$99). These are the source of truth — do not hardcode in UI.

## Environment Variables

See `docs/ENV_KEYS.md` for complete reference. Critical ones:
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — Shared DB
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Auth
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET` — Payments
- `GROQ_API_KEY` — Default AI provider
- `NEXT_PUBLIC_APP_URL` — App base URL (affects redirect links in emails/webhooks)

## Migration Files
- `scripts/migrate-audit-logs.sql` — Run manually to create audit_logs table
- `scripts/migrate-referrals.sql` — Run manually for referral fixes

## CI
GitHub Actions at `.github/workflows/ci.yml` runs typecheck + lint + build for both apps. No e2e tests yet — smoke test script at `scripts/smoke-test.js`.

## Recent Conventions (respect these)
- Commit messages use conventional format: `fix(scope): description`
- All PRs should be small (<300 LOC) with CHANGE SUMMARY at end
- Schema changes must be added to `apps/merchant/lib/schema.ts` AND a migration script
- Order status update API (`/api/orders/[id]/status`) sends WhatsApp notification to customer
- Payment auto-confirm: when customer says "paid/done/sent", bot auto-marks order as paid

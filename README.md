# Chatevo — WhatsApp Commerce Platform

> Turn WhatsApp into a full commerce engine. Sell products, automate customer conversations, manage orders — all from WhatsApp.

---

## Monorepo Layout

```
chatevo/                        ← repo root = Merchant App Next.js source
├── app/                        ← Next.js App Router (merchant pages + API)
├── components/                 ← UI components
├── lib/                        ← Business logic, DB, payments, AI
├── apps/
│   ├── merchant/               ← Workspace entry (@chatevo/merchant)
│   └── admin/                  ← Workspace entry (@chatevo/admin)
├── packages/
│   ├── db/                     ← Shared Drizzle schema + client (@chatevo/db)
│   └── shared/                 ← Shared types, env validation (@chatevo/shared)
├── wacommerce/
│   └── admin-panel/            ← Admin App Next.js source (canonical)
├── docs/                       ← ENV_KEYS.md, LOCAL_SETUP.md
└── scripts/                    ← sync-env.mjs
```

---

## Quick Start

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, CLERK keys, etc.
# See docs/ENV_KEYS.md for the full reference.

# 3. Push DB schema
npx drizzle-kit push   # uses drizzle.config.js at repo root

# 4. Run apps
npm run dev:merchant   # http://localhost:3000
npm run dev:admin      # http://localhost:3001 (new terminal)
```

---

## Deployment (Vercel)

Create **two separate Vercel projects** from this repository:

| Project | Root Directory | What it deploys |
|---------|---------------|-----------------|
| `chatevo-merchant` | `.` (default) | Merchant dashboard + public storefront |
| `chatevo-admin` | `wacommerce/admin-panel` | Platform admin panel |

Add environment variables to each project separately.  
See `docs/ENV_KEYS.md` for the complete variable list.

---

## Plans & Pricing

| Plan | Price | Products | Custom AI | White Label |
|------|-------|----------|-----------|-------------|
| Starter | $29/mo | 100 | ✗ | ✗ |
| Pro | $59/mo | 500 | ✓ | ✗ |
| Elite | $99/mo | 5,000 | ✓ | ✓ |

Payment providers: **Stripe** (global) · **Paystack** (Africa)

---

## Docs

- [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) — Full local dev setup guide
- [`docs/ENV_KEYS.md`](docs/ENV_KEYS.md) — Every environment variable documented
- [`docs/PRODUCTION_PLAYBOOK.md`](docs/PRODUCTION_PLAYBOOK.md) — Production deployment runbook

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Turso (libSQL) + Drizzle ORM |
| Auth | Clerk (multi-tenant) |
| Payments | Stripe · Paystack |
| AI | Groq (Llama) · Google Gemini · OpenAI-compatible |
| Cache | Upstash Redis |
| Email | Resend |
| Storage | Vercel Blob |
| Deployment | Vercel |

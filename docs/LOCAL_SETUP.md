# Local Development Setup

## Prerequisites

- **Node.js** ≥ 18 (`node --version`)
- **npm** ≥ 8 (`npm --version`)
- A [Turso](https://turso.tech) database
- A [Clerk](https://clerk.com) application

---

## 1. Clone and Install

```bash
git clone https://github.com/your-org/chatevo.git
cd chatevo

# Install all workspace dependencies (root + all apps + packages)
npm install
```

---

## 2. Set Up Environment Variables

```bash
# Copy the example to your local override (never commit this file)
cp .env.example .env.local

# Open and fill in the required values
# See docs/ENV_KEYS.md for what each variable does and where to get it
```

Required variables to get the merchant app running locally:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJ...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ENCRYPTION_KEY=<32 random chars>
OTP_HMAC_SECRET=<32 random chars>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Run `node scripts/sync-env.mjs` to automatically copy `.env.local` into  
> `wacommerce/admin-panel/.env.local` (needed if you run both apps).

---

## 3. Push Database Schema

```bash
# From repo root (merchant app schema)
npm run db:push --workspace=apps/merchant

# This runs: drizzle-kit push (reads drizzle.config.js at repo root)
```

---

## 4. Run the Apps

### Merchant App (port 3000)

```bash
npm run dev:merchant
# Visit: http://localhost:3000
```

### Admin Panel (port 3001)

```bash
# First sync env vars to admin app
node scripts/sync-env.mjs

npm run dev:admin
# Visit: http://localhost:3001
```

### Run both simultaneously

Open two terminals and run `npm run dev:merchant` and `npm run dev:admin` in each.

---

## 5. Sync Env Vars Between Apps

```bash
# Copies .env.local → wacommerce/admin-panel/.env.local
# Will NOT overwrite if already exists (use --force to override)
node scripts/sync-env.mjs

node scripts/sync-env.mjs --force
```

---

## 6. Type Checking

```bash
# Check all workspaces
npm run typecheck

# Check merchant only
npm run typecheck --workspace=apps/merchant
```

---

## Project Structure

```
chatevo/                        ← repo root = merchant app Next.js source
├── app/                        ← Next.js App Router pages (merchant)
│   ├── api/                    ← API routes
│   ├── dashboard/              ← Dashboard pages
│   └── store/                  ← Public storefront
├── components/                 ← UI components (merchant)
├── lib/                        ← Business logic (merchant)
│   ├── schema.ts               ← Drizzle ORM schema (source of truth)
│   ├── payments.ts             ← Stripe/Paystack billing (starter/pro/elite)
│   ├── db.ts                   ← DB client
│   └── ...
├── apps/
│   ├── merchant/               ← Workspace entry for merchant (pkg only, no src)
│   └── admin/                  ← Workspace entry for admin (pkg only, no src)
├── packages/
│   ├── db/                     ← Shared DB schema + client (@chatevo/db)
│   └── shared/                 ← Shared types, env validation (@chatevo/shared)
├── wacommerce/
│   └── admin-panel/            ← Admin app Next.js source (canonical)
│       └── src/
│           ├── app/
│           ├── lib/
│           └── middleware.ts
├── docs/                       ← Documentation
├── scripts/                    ← Developer utilities
└── .env.example                ← Template for environment variables
```

---

## Vercel Deployment

| App | Vercel Project Root | Build Command |
|-----|---------------------|---------------|
| Merchant | `.` | `next build` |
| Admin | `wacommerce/admin-panel` | `next build` |

Set environment variables in each Vercel project separately.  
See `docs/ENV_KEYS.md` for the full variable list per app.

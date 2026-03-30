<<<<<<< HEAD
# WCP Platform (Whatsapp Saas)

Internal commerce platform project.

## Structure
```
├── .github/          — Automation workflows
├── wacommerce/       — Core project logic
│   ├── docs/              — Documentation
│   ├── phase-1-waitlist/  — Pre-launch waitlist system
│   ├── phase-2-app/       — Main application (coming soon)
│   └── phase-3-launch/    — Launch materials
└── README.md         — Project overview
```

## Setup
- Copy `wacommerce/phase-1-waitlist/landing-page/config.example.php` to `config.php` and add your credentials
- See `wacommerce/docs/` folder for full documentation
=======
# SELLA — WhatsApp Commerce Platform

> **Phase 2 MVP** · Sell products directly inside WhatsApp. Set up your store in 5 minutes.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Turso](https://img.shields.io/badge/Turso-SQLite-teal)](https://turso.tech)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)

---

## 🌟 What is SELLA?

SELLA is a multi-tenant SaaS platform that turns any WhatsApp Business account into a fully automated online store. Customers can:
- Browse products via interactive menus
- Add items to cart
- Select delivery details
- Pay via Paystack (M-Pesa, cards) or PayPal
- Get order confirmations — all without leaving WhatsApp

Store owners get a full dashboard: product management, order tracking, inbox, contacts, and analytics.

---

## 📋 Feature Checklist

### ✅ Working (Phase 2 MVP)
- [x] **Authentication** — Clerk sign-up/sign-in with email OTP + Google OAuth
- [x] **Onboarding** — 3-field store setup (name, country, business type), 14-day trial starts
- [x] **Dashboard Home** — Real-time metrics: orders, revenue, contacts, top products
- [x] **Product Management** — CRUD with images, variants, inventory tracking, plan limits
- [x] **Order Management** — List with status/payment badges, WhatsApp status notifications
- [x] **Shared Inbox** — Conversation list + message threading, bot/human toggle, reply interface
- [x] **Contacts** — Auto-saved from WhatsApp, tags, order history, CSV export
- [x] **Settings** — Store info, WhatsApp credentials (encrypted), Payments (Paystack/PayPal/COD), Auto-replies, Billing
- [x] **WhatsApp Bot Engine** — Full in-chat shopping: Menu → Categories → Products → Variants → Cart → Delivery → Payment → Order
- [x] **Public Storefront** — `/store/[slug]` product grid with WhatsApp order buttons
- [x] **SaaS Subscription** — Paystack + Stripe checkout for $29/mo Starter plan
- [x] **Payment Webhooks** — Paystack & Stripe webhooks to upgrade/downgrade org plans
- [x] **Admin Panel** — `/admin` superadmin view with org/user/revenue metrics
- [x] **Cron Jobs** — `/api/cron/expire-trials` to downgrade expired trial accounts
- [x] **Trial Management** — 14-day trial countdown banner, auto-expiration
- [x] **Multi-tenant** — Complete org-based data isolation

### 🔧 Remaining / Next Phase
- [ ] **Drizzle Migrations** — Run `drizzle-kit push` to apply schema to Turso
- [ ] **Public API** (Phase 3) — REST API for third-party integrations
- [ ] **Growth/Premium Plans** — Higher limits, AI features, custom domains
- [ ] **AI Features** — Groq-powered product recommendations, smart FAQ
- [ ] **Analytics Charts** — Visual revenue/order charts
- [ ] **WhatsApp Broadcast** — Send messages to all contacts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SELLA Platform                       │
├──────────────┬──────────────┬───────────────┬──────────────┤
│  Next.js 14  │   Clerk Auth │  Turso SQLite │  Upstash     │
│  App Router  │  Multi-tenant│  Drizzle ORM  │  Redis       │
│              │  + webhooks  │  13 tables    │  Cart+State  │
├──────────────┼──────────────┼───────────────┼──────────────┤
│  WhatsApp    │   Paystack   │    Stripe     │   Resend     │
│  Meta Cloud  │  Africa pay  │  Global pay   │   Email      │
│  Webhook     │  + webhooks  │  + webhooks   │              │
└──────────────┴──────────────┴───────────────┴──────────────┘
```

**Tech Stack:**
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Auth | Clerk |
| Database | Turso (SQLite) + Drizzle ORM |
| Cache/State | Upstash Redis |
| Email | Resend |
| Payments (SaaS) | Paystack + Stripe |
| Payments (Store) | Paystack + PayPal |
| WhatsApp | Meta Cloud API |
| Deployment | Vercel |

---

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+
- [Turso account](https://turso.tech) (free tier is fine)
- [Upstash account](https://upstash.com) for Redis
- [Clerk account](https://clerk.com) for auth
- [Meta Developer account](https://developers.facebook.com) for WhatsApp
- [Paystack account](https://paystack.com) for payments (optional)
- [Stripe account](https://stripe.com) for payments (optional)
- [Resend account](https://resend.com) for emails (optional)

---

### Step 1 — Clone & Install

```bash
cd phase-2-app
npm install
```

### Step 2 — Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → Signing Secret |
| `TURSO_DATABASE_URL` | `turso db show --url <db-name>` |
| `TURSO_AUTH_TOKEN` | `turso db tokens create <db-name>` |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Redis Database |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Redis Database |
| `RESEND_API_KEY` | Resend → API Keys |
| `META_APP_SECRET` | Meta Developer Console → App Settings |
| `WA_WEBHOOK_VERIFY_TOKEN` | Choose any random string |
| `ENCRYPTION_KEY` | 32-char random hex: `openssl rand -hex 32` |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `CRON_SECRET` | Any random string for cron auth |
| `ADMIN_EMAILS` | Comma-separated admin email(s) |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (e.g. `https://sella-app.vercel.app`) |

### Step 3 — Database Setup

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create sella-prod

# Get credentials
turso db show --url sella-prod
turso db tokens create sella-prod

# Push schema to database
npx drizzle-kit push
```

### Step 4 — Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Set Sign-in/up URLs in Clerk Dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/onboarding`
3. Create a Webhook endpoint pointing to `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret as `CLERK_WEBHOOK_SECRET`

### Step 5 — WhatsApp Setup (Meta Developer Console)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an App → Business → WhatsApp
3. Add a test phone number
4. In the Dashboard → Settings:
   - **Webhook URL**: `https://your-domain.com/api/webhook`
   - **Verify Token**: Same as `WA_WEBHOOK_VERIFY_TOKEN` in `.env`
   - **Subscribe to**: `messages`
5. Copy your **Phone Number ID** and **Permanent Access Token**

Then in your SELLA dashboard → Settings → WhatsApp, paste these credentials.

### Step 6 — Run Locally

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000)

**For WhatsApp webhooks locally**, use ngrok:
```bash
npx ngrok http 3000
# Use the https URL as your Meta webhook URL
```

---

## 🚢 Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sella)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**In Vercel Dashboard → Settings → Environment Variables**, add all variables from `.env.example`.

### Vercel Cron Job Setup

Add to `vercel.json` in the root of `phase-2-app/`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-trials",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Payment Webhook URLs

| Provider | Webhook URL |
|----------|------------|
| Paystack | `https://sella-app.vercel.app/api/payments/webhook/paystack` |
| Stripe | `https://sella-app.vercel.app/api/payments/webhook/stripe` |

---

## 🎬 Demo Walkthrough

### 1. Create Your Store (2 minutes)
1. Go to `https://your-domain.com/sign-up`
2. Enter name, country, business type
3. Your store is created with a 14-day trial

### 2. Add Products
1. Dashboard → Products → Add Product
2. Fill name, price, images, category
3. Product is instantly live in your WhatsApp bot

### 3. Connect WhatsApp
1. Dashboard → Settings → WhatsApp tab
2. Paste your Meta Phone Number ID and Access Token
3. Click Save & Connect

### 4. Customer Shopping Flow (via WhatsApp)
Customer messages your number → Bot responds:
```
Hi! Welcome to [Store Name]!
🛍️ Browse Products | 🛒 View Cart | 📦 My Orders

> Customer: [Browse Products]

📦 Categories:
• Fashion & Clothing
• Electronics  
• Food & Beverages

> Customer: [Fashion]

Products:              
1. Blue T-Shirt — KES 1,500
2. Red Dress — KES 3,200

> Customer: [Blue T-Shirt]

[Product image sent]
Blue T-Shirt
KES 1,500 ✅ In stock

🛒 Add to Cart | ← Back

> Customer: [Add to Cart]

🛒 Your Cart:
1. Blue T-Shirt ×1 = KES 1,500
Total: KES 1,500

✅ Checkout | + Add More | 🗑️ Clear

> Customer: [Checkout]
> Customer: 123 Main Street, Nairobi

💳 Select Payment:
💳 Paystack/M-Pesa | 💵 PayPal | 💰 Cash on Delivery

> Customer: [Paystack/M-Pesa]

[Payment link sent]
✅ Order ORD-ABC123 Confirmed!
```

### 5. View in Dashboard
- Orders page shows new order with status "new"
- Inbox shows the conversation
- Click order → Update status → Customer gets WhatsApp notification

### 6. Subscribe
- Dashboard → Settings → Billing
- Click "Pay with Paystack" or "Pay with Stripe"
- 14-day trial extends to full subscription

---

## 📁 Project Structure

```
phase-2-app/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout with Clerk
│   ├── globals.css               # Global styles
│   ├── onboarding/               # Store setup wizard
│   ├── dashboard/                # Protected dashboard
│   │   ├── layout.tsx            # Dashboard layout + sidebar
│   │   ├── page.tsx              # Dashboard home (metrics)
│   │   ├── products/             # Products CRUD
│   │   ├── orders/               # Orders management
│   │   ├── inbox/                # WhatsApp inbox
│   │   ├── contacts/             # Customer contacts
│   │   └── settings/             # Store settings
│   ├── store/[slug]/             # Public storefront
│   ├── admin/                    # Superadmin panel
│   └── api/
│       ├── onboarding/           # Store creation
│       ├── products/             # Products API
│       ├── orders/               # Orders API
│       ├── contacts/             # Contacts API
│       ├── messages/             # Messages API
│       ├── conversations/        # Conversations API
│       ├── auto-replies/         # Auto-replies API
│       ├── settings/             # Settings APIs
│       ├── webhook/              # WhatsApp webhook
│       ├── webhooks/clerk/       # Clerk user sync
│       ├── payments/
│       │   ├── subscribe/        # SaaS subscription checkout
│       │   └── webhook/          # Payment webhooks
│       └── cron/                 # Cron jobs
├── lib/
│   ├── db.ts                     # Turso connection
│   ├── schema.ts                 # Drizzle schema (13 tables)
│   ├── redis.ts                  # Upstash Redis helpers
│   ├── encryption.ts             # AES-256 encryption
│   ├── whatsapp.ts               # Meta Cloud API client
│   ├── store-engine.ts           # WhatsApp shopping flow
│   ├── email.ts                  # Resend email templates
│   └── payments.ts               # Paystack + Stripe
├── middleware.ts                 # Clerk auth middleware
├── drizzle.config.ts             # Drizzle migrations config
└── .env.example                  # Environment template
```

---

## 🔐 Security

- **Encryption**: WhatsApp tokens and payment keys encrypted with AES-256-CBC before DB storage
- **Webhook verification**: Meta signature verification (`x-hub-signature-256`), Paystack HMAC, Stripe signature, svix (Clerk)
- **Auth**: All dashboard/admin routes protected by Clerk middleware
- **Multi-tenancy**: Every DB query scoped to `org_id`
- **Admin**: Email whitelist via `ADMIN_EMAILS` env variable

---

## 📞 Support

- Email: mazaoedu@gmail.com
- Docs: [Click here](https://sella-app.vercel.app/docs)
- WhatsApp: +254 700 000 000

---

Built with ❤️ for African micro-entrepreneurs
>>>>>>> 3118ae2795833d69dfaf48b94b5967ecc78dd093

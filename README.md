# SELLA — WhatsApp Commerce Platform

> **Phase 2 MVP** · Sell products directly inside WhatsApp. Set up your store in 5 minutes.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Turso](https://img.shields.io/badge/Turso-SQLite-teal)](https://turso.tech)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)

---

## 🚀 The Move to Sella Global (Latest Update)

We have successfully transitioned from a localized Kenyan MVP to a **Global-Ready Commerce Engine**. This update introduces critical infrastructure for international scaling and merchant flexibility:

### 🌍 Geographic Gating & Waitlist
- **Auto-Detection**: Integrated IP-based detection to identify merchant location during signup.
- **Global Waitlist**: Merchants outside supported regions (currently prioritized for Kenya) are automatically routed to a premium waitlist.
- **Bulk Onboarding**: Super Admin tools (`/admin/waitlist`) allow for cohort-based activation of international merchants as we expand.

### 📦 Smart Fulfillment & Delivery Zones
- **Zone-Based Fees**: Merchants can now define custom delivery zones (e.g., "Nairobi CBD", "Karen", "International") with specific flat-rate or calculated fees.
- **Product Types**: Added support for **Physical** goods, **Digital** downloads (auto-delivery), and **Services**.

### 💳 Manual Payment Verification (Till/Bank)
- **Proof of Payment**: Customers can now submit transaction codes or screenshots via WhatsApp.
- **Merchant Approval**: A new "Fulfillment" dashboard tab allows merchants to toggle manual payments and verify receipts before shipping.

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
- [x] **Global Rollout** — Geographic gating + Waitlist management
- [x] **Smart Fulfillment** — Delivery zones + Manual payment verification
- [x] **Authentication** — Clerk sign-up/sign-in with email OTP + Google OAuth
- [x] **Onboarding** — 3-field store setup (name, country, business type), 7-day trial starts
- [x] **Bot Personalization** — 5+ Menu styles, Emoji toggles, and Search/Category controls
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
- [x] **Trial Management** — 7-day trial countdown banner, auto-expiration
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
cd wacommerce/phase-2-app
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
| `ADMIN_USER_ID` | Your Clerk User ID for admin panel access |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (e.g. `https://sella-app.vercel.app`) |

### Step 3 — Database Setup

```bash
# Push schema to database
npx drizzle-kit push
```

---

## 📁 Project Structure

```
.
├── admin-panel/              # Legacy admin panel (optional)
├── wacommerce/
│   ├── docs/                 # Detailed documentation
│   ├── phase-1-waitlist/     # Landing page & initial leads
│   └── phase-2-app/          # Main current application (Next.js 14)
└── README.md                 # This overview
```

---

## 🔐 Security

- **Encryption**: WhatsApp tokens and payment keys encrypted with AES-256-CBC before DB storage
- **Webhook verification**: Meta signature verification (`x-hub-signature-256`), Paystack HMAC, Stripe signature, svix (Clerk)
- **Auth**: All dashboard/admin routes protected by Clerk middleware
- **Multi-tenancy**: Every DB query scoped to `org_id`
- **Admin**: Clerk-ID based gating via `ADMIN_USER_ID` env variable

---

## 📞 Support

- Email: mazaoedu@gmail.com
- Docs: [Click here](https://sella-app.vercel.app/docs)

---

Built with ❤️ for Global Micro-Entrepreneurs

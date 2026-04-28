# CHATEVO - Project Context for AI

## Overview
**CHATEVO** is a multi-tenant SaaS platform designed to turn any WhatsApp Business account into a fully automated online store. It allows customers to browse products, add items to a cart, select delivery details, and pay directly within WhatsApp. 

This repository (`wcp-main`) is a large Next.js monorepo containing the main application and several sub-modules representing different phases of the project.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS, class-variance-authority, clsx, Radix UI (shadcn/ui-like components)
- **Authentication**: Clerk (Multi-tenant + webhooks)
- **Database**: Turso (SQLite) + Drizzle ORM
- **State/Cache**: Upstash Redis (Cart & State Management)
- **Payments**: Paystack (Africa/M-Pesa), Stripe (Global SaaS subscriptions), PayPal
- **Email**: Resend
- **Integrations**: Meta Cloud API (WhatsApp Webhooks)

## Repository Structure

The project is structured with the main application residing in the root folder, and various legacy or phase-specific sub-projects located in subdirectories.

### Root Level (Main Application)
The root directory acts as the primary Next.js application (`chatevo-platform`).
- `app/`: Next.js App Router root.
  - `/admin`: Super admin panel.
  - `/dashboard`: Merchant dashboard (Product management, Order management, Inbox, Contacts, Settings).
  - `/api`: Backend API routes and webhooks (Stripe, Paystack, Clerk, WhatsApp).
  - `/store`: Public-facing storefronts for merchants (`/store/[slug]`).
  - `/sign-in`, `/sign-up`, `/onboarding`: Auth and merchant onboarding flows.
- `components/`: Reusable React components (UI elements, Layouts, Providers).
- `lib/`: Core utilities, database connection configurations, schema definitions, and shared helpers.
- `src/`: Alternate source directory containing additional `app/` and `lib/` files.
- Configuration Files:
  - `package.json`: Contains project dependencies and scripts (`dev`, `build`, `db:push`).
  - `drizzle.config.js`: Database configuration for Turso.
  - `middleware.ts`: Next.js middleware for handling authentication and edge logic.

### Sub-Modules & Phases
- `wacommerce/`: Contains documentation and historical phases of the application.
  - `phase-1-waitlist/`: The initial landing page and waitlist module.
  - `phase-2-app/`: Historically the main application folder (currently the user is working on `SYNC_TEST.md` here).
  - `phase-3-launch/`: Future launch configurations.
  - `docs/`: In-depth documentation and `AGENTS.md`.
- `sella-marketing-hub/`: A module likely intended for marketing tools and campaigns.
- `theme-factory/`: Module for managing dynamic or tenant-specific themes.
- `webapp-testing/`: Test suite or testing environment configurations.

## Key Features & Business Logic
1. **Global Gating & Waitlist**: IP-based location detection. Prioritizes specific regions (like Kenya) and routes others to a waitlist.
2. **Smart Fulfillment**: Custom delivery zones with flat-rate or calculated fees. Supports physical, digital, and service products.
3. **Multi-Tenant Architecture**: Complete organizational data isolation powered by Clerk and database row-level security (`org_id`).
4. **WhatsApp Bot Engine**: Fully interactive in-chat shopping experience handled via Meta Webhooks. State is maintained using Redis.
5. **Billing & SaaS**: Subscription management using Stripe and Paystack webhooks to upgrade/downgrade organizational plans. Automatically handles 7-day trials via cron jobs.
6. **Manual Payments**: Supports proof of payment (transaction codes/screenshots) verification via WhatsApp, approved by the merchant in the dashboard.

## Security Practices
- **Encryption**: WhatsApp tokens and payment keys are encrypted using AES-256-CBC before being saved to the database.
- **Webhook Verification**: Enforces rigorous verification for Meta signatures (`x-hub-signature-256`), Paystack HMAC, Stripe signatures, and Clerk (`svix`).
- **Authorization**: Protected dashboard routes via Clerk middleware. Admin functions gated by `ADMIN_USER_ID`.

## Instructions for AI
- When modifying database schemas, check `drizzle.config.js` and use Drizzle ORM syntax.
- Ensure all new API routes correctly implement webhook verification if they are receiving external data.
- UI components should follow the existing Tailwind and Radix UI patterns found in `components/`.
- Respect the multi-tenant architecture: always scope database queries with the current user's `org_id`.

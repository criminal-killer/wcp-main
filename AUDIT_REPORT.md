# Chatevo Full Project Audit Report

**Date:** 2026-05-24
**Audited by:** OpenClaude (6 parallel deep audits)
**Scope:** Full codebase — actual code, not documentation

---

## Table of Contents

1. [Critical Security Vulnerabilities](#critical-security-vulnerabilities)
2. [High Severity Issues](#high-severity-issues)
3. [Broken Features](#broken-features)
4. [Dead Code & Unused Exports](#dead-code--unused-exports)
5. [Missing Implementations](#missing-implementations)
6. [UI/UX Issues](#uiux-issues)
7. [Schema & Database Issues](#schema--database-issues)
8. [Infrastructure & Config Issues](#infrastructure--config-issues)
9. [What's Working](#whats-working)
10. [Priority Fix List](#priority-fix-list)

---

## Critical Security Vulnerabilities

> **Status:** All 6 critical issues FIXED on 2026-05-24. See [FIXES.md](./FIXES.md) for details.

### 1. `/api/debug-db` — Zero Auth, Leaks All Messages — FIXED

- **File:** `apps/merchant/app/api/debug-db/route.ts`
- **Impact:** Returns 10 most recent messages from ALL organizations with NO authentication. Cross-tenant data leak.
- **Fix:** Delete this endpoint entirely from production code.

### 2. `/api/ai/chat` — Authentication Bypass — FIXED

- **File:** `apps/merchant/app/api/ai/chat/route.ts:43`
- **Impact:** If no Clerk user is found, accepts `org_id` from request body. Any unauthenticated user can chat with the AI and enumerate org data by providing any `org_id`.
- **Fix:** Remove the `org_id` fallback for unauthenticated requests, or require a signed token.

### 3. `/api/payments/store-webhook` — Payment Forgery — FIXED

- **File:** `apps/merchant/app/api/payments/store-webhook/route.ts:45-51`
- **Impact:** Failed signature verification only logs a warning and continues processing. An attacker can forge payment webhooks and mark orders as paid.
- **Fix:** Return 401 when signature verification fails instead of continuing.

### 4. Cross-Tenant Order Update via `order_number` — FIXED

- **File:** `apps/merchant/app/api/payments/store-webhook/route.ts:61`
- **Impact:** Updates orders by `order_number` only — no `org_id` filter. Two orgs with the same order number = data corruption. Order numbers are generated from `Date.now().toString(36).toUpperCase()` with no unique constraint.
- **Fix:** Add `eq(orders.org_id, orgId)` to the WHERE clause.

### 5. Hardcoded OTP Secret Fallback — FIXED

- **Files:** `apps/merchant/app/api/auth/send-otp/route.ts:86`, `verify-otp/route.ts:5`, `otp-status/route.ts:5`
- **Impact:** Falls back to `'chatevo-otp-secret-change-in-production'` — a publicly known secret from the source code. OTPs are trivially forgeable.
- **Fix:** Make `OTP_HMAC_SECRET` mandatory. Throw if env var is missing.

### 6. Hardcoded Database Credentials in Git — FIXED

- **File:** `find-user.js:14-15`
- **Impact:** Contains hardcoded Turso database URL and auth token in a git-tracked file.
- **Fix:** Remove credentials from file immediately, rotate the auth token.

---

## High Severity Issues

> **Status:** 4/6 high severity issues FIXED on 2026-05-24. See [FIXES.md](./FIXES.md) for details.

### 7. Abandoned Cart Cron Completely Broken — FIXED

- **File:** `apps/merchant/app/api/cron/abandoned-cart/route.ts:30`
- **Impact:** Queries `order_status='pending'` but store-engine creates orders as `order_status='new'`. Zero abandoned cart reminders will ever be sent.
- **Fix:** Change query to `eq(orders.order_status, 'new')`.

### 8. Always-True Payment Condition — FIXED

- **File:** `apps/merchant/lib/store-engine.ts:768`
- **Impact:** `org.store_paystack_key_encrypted || !org.store_paystack_key_encrypted` is always true. Paystack option is always shown even for merchants who haven't configured it.
- **Fix:** Remove `|| !org.store_paystack_key_encrypted` from the condition.

### 9. Cron Endpoints Have Optional Auth — FIXED

- **Files:** `apps/merchant/app/api/cron/payouts/route.ts`, `apps/merchant/app/api/cron/abandoned-cart/route.ts`
- **Impact:** `CRON_SECRET` check is optional — if env var is missing, anyone can trigger payouts and reminders.
- **Fix:** Make `CRON_SECRET` check mandatory. Return 401 if env var is not set.

### 10. WhatsApp Webhook Signature Skippable

- **File:** `apps/merchant/app/api/webhook/route.ts`
- **Impact:** If `WHATSAPP_APP_SECRET` env var is not set, signature verification is skipped entirely.
- **Fix:** Make the env var mandatory or log a loud warning at startup.

### 11. Merchant Schema Has Zero Database Indexes

- **File:** `apps/merchant/lib/schema.ts`
- **Impact:** Admin schema has 14+ indexes. Merchant has none. Every WhatsApp message triggers full table scans on contacts, conversations, messages, orders.
- **Fix:** Add indexes matching admin schema on: `contacts.(org_id, phone)`, `conversations.(org_id, contact_id)`, `messages.(conversation_id, created_at)`, `orders.(org_id, created_at)`, etc.

### 12. Divergent Schemas (Merchant vs Admin)

- **Files:** `apps/merchant/lib/schema.ts`, `apps/admin/src/lib/schema.ts`
- **Impact:** Both apps share the same Turso DB but have 20+ column differences. Admin cannot see `stores`, `meta_business_id`, `product_type`, etc. Merchant cannot see `bot_menu_style`, `usage_ai_daily_count`, `is_super_admin`, etc.
- **Fix:** Unify into single source of truth in `packages/db`, or keep schemas manually in sync.

**Schema Differences Detail:**

| Merchant Has, Admin Missing | Admin Has, Merchant Missing |
|---|---|
| `stores` table | `leads` table |
| `organizations.meta_business_id` | `marketing_posts` table |
| `organizations.wa_catalog_id` | `organizations.bot_menu_style` |
| `organizations.category_mapping` | `organizations.bot_emojis_enabled` |
| `products.store_id` | `organizations.bot_custom_footer` |
| `products.sub_category` | `organizations.bot_show_search` |
| `products.product_type` | `organizations.bot_show_categories` |
| `products.digital_content` | `organizations.bot_show_cart` |
| `products.service_duration` | `organizations.bot_show_orders` |
| `orders.payment_link` | `organizations.usage_ai_daily_count` |
| | `organizations.usage_ai_monthly_count` |
| | `organizations.is_waitlisted` |
| | `organizations.enabled_features` |
| | `products.color` |
| | `products.metadata` |
| | `orders.delivery_zone` |
| | `orders.payment_proof` |
| | `users.is_super_admin` |
| | `affiliates.referred_by_id` |
| | `affiliates.username` |
| | `affiliates.total_network` |
| | `conversations.temp_flow_state` |

**Default value conflicts:**
- Admin: `country: 'KE'`, `timezone: 'Africa/Nairobi'`, `ai_provider: 'chatevo'`
- Merchant: `country: 'US'`, `timezone: 'UTC'`, `ai_provider: 'Chatevo'`

---

## Broken Features

| # | Feature | File:Line | Issue |
|---|---------|-----------|-------|
| 1 | Orders button | `store-engine.ts:173-176` | Always returns "no active orders" — stub, never queries DB |
| 2 | Payment "paid" keyword | `store-engine.ts:108-136` | Anyone can type "paid" to mark order as paid without actual payment verification |
| 3 | Inventory never decremented | `store-engine.ts:859-873` | Stock is never reduced when orders are placed |
| 4 | Outbound bot messages not saved | `webhook/route.ts` | Dashboard conversation view is incomplete — only inbound + human-agent messages stored |
| 5 | `markMessageRead` never called | `whatsapp.ts:193` | Messages never marked as read on WhatsApp side |
| 6 | Notifications `unread` filter | `notifications/route.ts` | `unread` query parameter computed but never used in the query |
| 7 | Ticket admin notification | `tickets/route.ts:71-78` | Builds WhatsApp message, logs to console, never actually sends |
| 8 | PayPal link construction | `store-engine.ts:852` | Uses email prefix as `paypal.me` username — often wrong |
| 9 | `greeting` state unreachable | `store-engine.ts:161-165` | `continue` is caught before the switch, so greeting case never sees it |
| 10 | Out-of-stock bypass | `store-engine.ts:505-506` | No inventory check when processing `add_` action — crafted button IDs can add out-of-stock items |
| 11 | `payment_status` not validated | `orders/[id]/status/route.ts` | Accepts any arbitrary string |
| 12 | Store PATCH missing `org_id` | `stores/route.ts:123` | UPDATE only filters by `stores.id`, TOCTOU race condition |
| 13 | Conversation update missing `org_id` | `messages/send/route.ts:75` | Update only filters by `conversation_id` |
| 14 | Revenue page fake stats | `admin/revenue/page.tsx:51,66,77` | "+12.5%", "+4 new today", "$342.10 LTV" are hardcoded static strings |
| 15 | Waitlist fake stats | `admin/waitlist/page.tsx:41,49` | "42 Beta Interested", "85%" are hardcoded |
| 16 | System health checks mocked | `admin/system/page.tsx:7-10` | All hardcoded to `true` |
| 17 | Admin plan badge | `admin/page.tsx:87` | Always shows "Starter" for every user |

---

## Dead Code & Unused Exports

### Unused Exported Functions

| Function | File:Line | Status |
|----------|-----------|--------|
| `markMessageRead` | `lib/whatsapp.ts:193` | Exported, never called anywhere |
| `rateLimit` | `lib/redis.ts:29` | Exported, never called — no rate limiting exists |
| `getCachedProducts` | `lib/redis.ts:86` | Exported, never called — product cache unused |
| `setCachedProducts` | `lib/redis.ts:93` | Exported, never called — product cache unused |

### Unused Imports

| Import | File:Line | Status |
|--------|-----------|--------|
| `sendImageMessage` | `lib/store-engine.ts:4` | Imported, never used |
| `redis` | `webhook/route.ts:6` | Imported, never used |
| `getFlowState` | `webhook/route.ts:6` | Imported, never used |
| `setFlowState` | `webhook/route.ts:6` | Imported, never used |
| `deleteFlowState` | `webhook/route.ts:6` | Imported, never used |
| `getCart` | `webhook/route.ts:6` | Imported, never used |
| `setCart` | `webhook/route.ts:6` | Imported, never used |
| `clearCart` | `webhook/route.ts:6` | Imported, never used |
| `sql` | `stores/route.ts:5` | Imported, never used |
| `encrypt` | `settings/store/route.ts` | Imported, never used |

### Dead Code Conditions

| Item | File:Line | Reason |
|------|-----------|--------|
| `'  back'` check | `store-engine.ts:501` | No button sends this value |
| `greeting` case | `store-engine.ts:161-165` | Unreachable for `continue` input |

### Unused Schema Tables

| Table | Status |
|-------|--------|
| `templates` | Never queried by any merchant code |
| `waitlist` | Never queried by merchant app |
| `sequences` | Never queried — order numbers use `Date.now().toString(36)` |
| `carts` | Never queried — carts use Redis |

### Unused Schema Columns (15+)

| Table | Columns |
|-------|---------|
| `organizations` | `subscription_id`, `payment_provider`, `store_stripe_account_id`, `store_mpesa_till`, `store_bank_details`, `free_delivery_above`, `delivery_zones`, `business_hours`, `logo_url`, `language` |
| `products` | `digital_content`, `service_duration` |
| `conversations` | `assigned_to` |
| `messages` | `sent_by` (written but never read back) |

### Dead Workspace Packages

| Package | Status |
|---------|--------|
| `@chatevo/db` | Declared in both apps' `package.json`, never imported |
| `@chatevo/shared` | Declared in both apps' `package.json`, never imported |

### Dead Files

| File | Issue |
|------|-------|
| `apps/merchant/drizzle.config.ts.bak` | Backup file using deprecated drizzle-kit config |
| `apps/merchant/scratch-test.ts` | Debug script with hardcoded org ID and phone number |
| `apps/admin/package-lock-admin.json` | Orphaned lock file |
| `apps/admin/src/find-user.js` | Duplicate of root-level file |
| `apps/admin/src/fix-encoding.js` | Duplicate of root-level file |
| `apps/admin/src/package-lock.json` | Orphaned inside `src/` |
| `apps/admin/src/SYNC_TEST.md` | Test artifact |

---

## Missing Implementations

| Missing | Impact |
|---------|--------|
| Rate limiting on any endpoint | Webhook, OTP, affiliate apply all vulnerable to flooding |
| Delivery address validation | Any single character accepted as address |
| `payment_status` validation | Accepts any arbitrary string in order update |
| Pagination on `/api/messages` | Can return unbounded result sets |
| SQL-level search filtering | `/api/contacts` and `/api/orders` filter in JavaScript after fetching all rows |
| Try/catch on 16+ API routes | Unhandled exceptions produce raw 500s with no JSON body |
| Unique constraint on `contacts.(org_id, phone)` | Race condition on concurrent webhooks = duplicate contacts |
| Unique constraint on `orders.order_number` | Order number collision possible |
| Global `error.tsx` in merchant app | Only dashboard page handles errors |
| `not-found.tsx` in either app | No custom 404 pages |
| `loading.tsx` / Suspense boundaries | Most dashboard pages have no loading states |
| Outbound message logging for bot | Audit trail incomplete |
| Inventory decrement on order | Stock never reduced |

### API Routes Missing Try/Catch

- `/api/auto-replies` (GET, POST)
- `/api/contacts` (GET)
- `/api/contacts/export` (GET)
- `/api/conversations` (GET, PUT)
- `/api/messages` (GET)
- `/api/orders` (GET)
- `/api/notifications` (GET, PATCH)
- `/api/stores` (GET, POST, PATCH)
- `/api/products` (GET, POST)
- `/api/products/[id]` (GET, PUT, DELETE)
- `/api/referrals/me` (GET)
- `/api/settings/store` (PUT)
- `/api/settings/payments` (PUT)
- `/api/cron/expire-trials` (GET)
- `/api/affiliates/me` (GET)
- `/api/affiliates/referrals` (GET)

---

## UI/UX Issues

### Broken Links (Will Show 404)

| Link | Found In | Target Exists? |
|------|----------|----------------|
| `/privacy` | Landing page footer | NO |
| `/terms` | Landing page footer | NO |
| `/demo` | Landing page | NO |
| `/dashboard/contacts/[id]` | Contacts list "View" button | NO |
| `/dashboard/settings/support` | Docs page | NO |
| `http://localhost:3000` | Admin not-authorized page | Hardcoded localhost |

### Non-Functional UI Elements

| Element | File | Issue |
|---------|------|-------|
| Orders search + status filter | `dashboard/orders/page.tsx` | No onChange/onClick handlers |
| Products search + category filter | `dashboard/products/page.tsx` | No onChange handlers |
| Contacts search | `dashboard/contacts/page.tsx` | No onChange handler |
| Admin users search + filter | `admin/users/page.tsx` | No handlers |
| Admin waitlist Export CSV | `admin/waitlist/page.tsx` | No onClick handler |
| Admin waitlist Migrate All | `admin/waitlist/page.tsx` | No onClick handler |
| Admin system Quick Actions | `admin/system/page.tsx` | Clear Cache, Backup DB, Flush Logs, Panic Mode — no handlers |
| Admin View All button | `admin/page.tsx` | No handler |
| Docs Previous/Next | `dashboard/docs/page.tsx` | No handlers |

### Hardcoded Marketing Claims (Inconsistent)

| Claim | File |
|-------|------|
| "Join 1,000+ professional merchants" | `app/page.tsx:324` |
| "Trusted by 5,000+ businesses" | `sign-up/choose-plan/page.tsx:163` |
| "Trusted by 500+ global brands" | `onboarding/page.tsx:178` |
| Fake live activity notifications | `app/page.tsx` (LiveActivity component) |
| `ratingValue: "4.8"`, `reviewCount: "127"` | `app/page.tsx:225-226` |

### Inconsistent Domain Names

| Domain | Where Used |
|--------|-----------|
| `chatsevo.com` | `layout.tsx:38`, `page.tsx:235-244`, `vercel.json:16` |
| `chatevo-app.vercel.app` | `sitemap.ts:4`, `robots.ts:4`, `email.ts:10` |
| `chatevo.app` | `referrals/page.tsx:23`, `referrals/me/route.ts:27` |
| `app.chatevo.io` | `.env.example:117`, `admin/affiliates/actions.ts:12,60,98` |

---

## Schema & Database Issues

### Missing Indexes

The merchant schema defines **zero indexes**. The admin schema has 14+. Critical missing indexes:

| Table | Columns | Query Pattern |
|-------|---------|---------------|
| `organizations` | `wa_phone_number_id` | Webhook lookup by phone |
| `organizations` | `slug` | Store URL resolution |
| `products` | `(org_id, is_active)` | Product listing |
| `products` | `(org_id, category)` | Category filtering |
| `contacts` | `(org_id, phone)` | Webhook contact lookup |
| `contacts` | `(org_id, created_at)` | Contact listing |
| `conversations` | `(org_id, contact_id)` | Conversation lookup |
| `conversations` | `(org_id, last_message_at)` | Inbox ordering |
| `messages` | `(conversation_id, created_at)` | Message loading |
| `messages` | `(org_id, created_at)` | Message queries |
| `orders` | `org_id` | Order listing |
| `orders` | `(org_id, created_at)` | Order ordering |
| `orders` | `(org_id, payment_status)` | Payment filtering |
| `orders` | `order_number` | Webhook order lookup |

### Foreign Key Issues

- `audit_logs.admin_id` is plain text in merchant schema, has FK in admin schema
- `referrals.referrer_org_id` stores affiliate IDs, not org IDs (semantic mismatch at `payments/webhook/paystack/route.ts:129`)
- No DELETE cascade handling — soft-deleting an org leaves all related records orphaned

### Migration Issues

- No formal migration framework (no Drizzle Kit migrate, no versioning table)
- 4 ad-hoc TypeScript scripts + 2 SQL files spread across two directories
- Scripts must be run manually and in order
- `migrate-catalog.ts` exists but Meta Catalog was supposedly rolled back

---

## Infrastructure & Config Issues

### Conflicting Next.js Config (Merchant)

- `next.config.js` (CommonJS) and `next.config.mjs` (ESM) both exist
- `.mjs` wins, so `serverComponentsExternalPackages` and `transpilePackages` from `.js` are **silently ignored**
- `experimental.serverComponentsExternalPackages` is deprecated in Next.js 14.2+ (should be `serverExternalPackages`)

### Environment Variable Issues

**Documented in `.env.example` but NEVER used in code:**

| Variable |
|----------|
| `NEXT_PUBLIC_ADMIN_URL` |
| `NEXT_PUBLIC_WA_WEBHOOK_VERIFY_TOKEN` |
| `STRIPE_PUBLISHABLE_KEY` |
| `STRIPE_STARTER_PRICE_ID` / `PRO` / `ELITE` |
| `PAYSTACK_STARTER_PLAN_CODE` / `PRO` / `ELITE` |
| `GOOGLE_GEMINI_API_KEY` |
| `BLOB_READ_WRITE_TOKEN` |
| `EMAIL_FROM_DOMAIN` |

**Used in code but NOT in `.env.example`:**

| Variable | Used At |
|----------|---------|
| `SUPER_ADMIN_EMAIL` | `admin/api/auth/super-login/route.ts:10` |
| `SUPER_ADMIN_PASSWORD` | `admin/api/auth/super-login/route.ts:11` |
| `KV_REST_API_URL` | `merchant/lib/redis.ts:5,7` |
| `KV_REST_API_TOKEN` | `merchant/lib/redis.ts:8` |
| `SMOKE_TEST_URL` | `scripts/smoke-test.js:8` |

### Committed Build Artifacts

| Path | Size |
|------|------|
| `apps/merchant/.next/` | Build output |
| `apps/merchant/tsconfig.tsbuildinfo` | 1.4MB |
| `apps/admin/src/.next/` | Build output inside src/ |

### Admin Super-Login Security

- **File:** `apps/admin/src/app/api/auth/super-login/route.ts:20`
- Plaintext password comparison (no bcrypt)
- No brute-force protection, no rate limiting
- Credentials stored as plain env vars

### Encryption Uses CBC Instead of GCM

- **File:** `apps/merchant/lib/encryption.ts`
- Uses `aes-256-cbc` (confidentiality only, no integrity/authentication)
- Should use `aes-256-gcm` for authenticated encryption

### No Test Suite

- Zero `*.test.ts` or `*.spec.ts` files in the entire project
- `scripts/smoke-test.js` exists but only tests 5 routes

---

## What's Working

| Area | Status | Notes |
|------|--------|-------|
| WhatsApp webhook verification (GET) | OK | Token match works |
| Webhook signature verification (Paystack SaaS) | OK | HMAC verification implemented |
| Webhook signature verification (Stripe) | OK | `constructEvent` used |
| Webhook signature verification (Clerk) | OK | Svix verification |
| Contact upsertion | OK | Find-or-create by phone |
| Conversation management | OK | Created on first message |
| Inbound message persistence | OK | Saved to messages table |
| Flow state machine | OK | browse > select > cart > checkout > payment |
| Cart management via Redis | OK | 24h TTL, per-org per-phone |
| Greeting and menu display | OK | Interactive buttons work |
| Category/subcategory browsing | OK | Interactive list picker |
| Product detail with variants | OK | Variant selection flow |
| Quantity selection | OK | Numeric input handling |
| Cart editing | OK | Change qty, remove item |
| AI fallback | OK | Groq/custom providers |
| Paystack payment link generation | OK | When key exists |
| CTA URL payment buttons | OK | WhatsApp native |
| Order creation in DB | OK | With line items as JSON |
| Test WhatsApp connection | OK | Settings page |
| Human agent messaging | OK | With bot-to-human switch |
| Order status updates | OK | With WhatsApp notification |
| Error logging system | OK | Categorized, with severity |
| Affiliate system | OK | Apply, referrals, payouts |
| Clerk auth middleware | OK | Both apps |
| Multi-tenant org_id scoping | OK | 95%+ of queries |
| Meta Commerce Catalog sync | OK | Batch API |
| Email via Resend | OK | Graceful no-op when key missing |
| OTP verification | OK | Timing-safe comparison |
| Cron: trial expiry | OK | Downgrades expired trials |
| Cron: affiliate payouts | OK | (but auth optional) |
| Database connection | OK | Lazy proxy pattern |
| Drizzle ORM queries | OK | Properly parameterized, no SQL injection |
| TypeScript compilation | OK | Both apps pass typecheck |
| Build | OK | Both apps build successfully |

---

## Priority Fix List

### P0 — Security (Fix Today)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Debug endpoint leaks data | `api/debug-db/route.ts` | Delete the file |
| 2 | AI chat auth bypass | `api/ai/chat/route.ts:43` | Require Clerk session, remove org_id body fallback |
| 3 | Payment forgery | `api/payments/store-webhook/route.ts:45-51` | Return 401 on failed signature verification |
| 4 | Cross-tenant order update | `api/payments/store-webhook/route.ts:61` | Add `eq(orders.org_id, orgId)` to WHERE |
| 5 | Hardcoded OTP secret | `auth/send-otp/route.ts:86` | Make `OTP_HMAC_SECRET` mandatory |
| 6 | Hardcoded DB credentials | `find-user.js:14-15` | Remove credentials, rotate token |

### P1 — Broken Functionality

| # | Issue | File | Fix |
|---|-------|------|-----|
| 7 | Abandoned cart cron broken | `cron/abandoned-cart/route.ts:30` | Change `'pending'` to `'new'` |
| 8 | Always-true payment condition | `store-engine.ts:768` | Remove `\|\| !org.store_paystack_key_encrypted` |
| 9 | Optional cron auth | `cron/payouts/route.ts` | Make `CRON_SECRET` check mandatory |
| 10 | WhatsApp signature skippable | `webhook/route.ts` | Make `WHATSAPP_APP_SECRET` mandatory |
| 11 | Orders button stub | `store-engine.ts:173-176` | Query orders table for the contact |
| 12 | Payment "paid" trusts user | `store-engine.ts:108-136` | Add payment verification |
| 13 | No inventory decrement | `store-engine.ts:859-873` | Decrement stock on order |
| 14 | Bot messages not saved | `webhook/route.ts` | Save outbound to messages table |

### P2 — Schema & Performance

| # | Issue | Fix |
|---|-------|-----|
| 15 | No database indexes | Add 14+ indexes matching admin schema |
| 16 | Divergent schemas | Unify or sync manually |
| 17 | No unique constraint on contacts | Add `(org_id, phone)` unique index |
| 18 | No unique constraint on order_number | Add unique index |
| 19 | In-memory filtering | Move search to SQL WHERE clauses |
| 20 | No pagination on messages | Add limit/offset |

### P3 — Quality & Cleanup

| # | Issue | Fix |
|---|-------|-----|
| 21 | Remove dead code | Clean unused exports, imports, tables |
| 22 | Add try/catch to 16+ routes | Wrap handlers in error boundaries |
| 23 | Delete debug endpoints | Remove `/api/debug-db` |
| 24 | Clean committed artifacts | Add to .gitignore, remove from git |
| 25 | Fix conflicting next.config | Merge into single `next.config.mjs` |
| 26 | Add error.tsx to merchant | Global error boundary |
| 27 | Add not-found.tsx | Custom 404 pages |
| 28 | Fix broken links | Remove or implement /privacy, /terms, /demo |
| 29 | Fix hardcoded data | Remove fake stats, fix domain inconsistencies |
| 30 | Switch to aes-256-gcm | Authenticated encryption |

---

*Report generated by 6 parallel audit agents scanning project structure, database schema, API routes, WhatsApp/store engine, payments/auth, and UI components.*

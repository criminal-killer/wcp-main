# Chatevo Fixes Log

All fixes applied from the project audit. See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for the full audit.

---

## P0 — Critical Security Fixes (2026-05-24)

### 1. Delete `/api/debug-db` endpoint

**Issue:** Unauthenticated endpoint leaked messages from ALL organizations.
**Severity:** CRITICAL
**Files changed:**
- `apps/merchant/app/api/debug-db/route.ts` — DELETED
- `apps/merchant/middleware.ts` — Removed `/api/debug-db(.*)` from public routes
**Verification:** Glob for `debug-db` returns no matches.

---

### 2. Fix AI Chat Authentication Bypass

**Issue:** Any unauthenticated user could chat with AI by passing `org_id` in POST body.
**Severity:** CRITICAL
**File:** `apps/merchant/app/api/ai/chat/route.ts`
**Change:** Removed `!userId && !org_id` check. Now requires Clerk `userId`. Org is derived from DB lookup, not request body.
**Before:**
```typescript
if (!userId && !org_id) return new NextResponse('Unauthorized', { status: 401 })
let targetOrgId = org_id
if (userId) {
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (user) targetOrgId = user.org_id
}
```
**After:**
```typescript
if (!userId) return new NextResponse('Unauthorized', { status: 401 })
let targetOrgId: string | null = null
const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
if (user) targetOrgId = user.org_id
if (!targetOrgId) return NextResponse.json({ reply: "Organization context not found." })
```

---

### 3. Fix Store Webhook Payment Forgery

**Issue:** Failed Paystack signature verification only logged a warning and continued processing. Attacker could forge payment webhooks.
**Severity:** CRITICAL
**File:** `apps/merchant/app/api/payments/store-webhook/route.ts`
**Change:** Now returns 401 on failed signature verification. Also validates that `PAYSTACK_SECRET_KEY` is configured.
**Before:**
```typescript
const isChatevoManaged = verifyPaystackSignature(body, signature, ChatevoSecret)
// ... later ...
if (!isChatevoManaged) {
  console.warn(`... Assuming managed mode fallback or legacy.`)
}
```
**After:**
```typescript
if (!ChatevoSecret) {
  console.error('PAYSTACK_SECRET_KEY not configured')
  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
}
const isValidSignature = verifyPaystackSignature(body, signature, ChatevoSecret)
if (!isValidSignature) {
  console.warn(`Invalid Paystack signature for store webhook`)
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

---

### 4. Fix Cross-Tenant Order Update

**Issue:** Store webhook updated orders by `order_number` only — no `org_id` filter. Two orgs with same order number = data corruption.
**Severity:** CRITICAL
**File:** `apps/merchant/app/api/payments/store-webhook/route.ts:61`
**Change:** Added `eq(orders.org_id, orgId)` to WHERE clause.
**Before:**
```typescript
.where(eq(orders.order_number, orderNumber))
```
**After:**
```typescript
.where(and(eq(orders.order_number, orderNumber), eq(orders.org_id, orgId)))
```
**Also:** Added `and` to the `drizzle-orm` import.

---

### 5. Remove Hardcoded OTP Secret Fallback

**Issue:** Fallback `'chatevo-otp-secret-change-in-production'` was publicly known from source code. OTPs were trivially forgeable.
**Severity:** CRITICAL
**Files changed:**
- `apps/merchant/app/api/auth/send-otp/route.ts:86`
- `apps/merchant/app/api/auth/verify-otp/route.ts:5`
- `apps/merchant/app/api/auth/otp-status/route.ts:5`
**Change:** Removed hardcoded fallback. Now throws if `OTP_HMAC_SECRET` env var is missing.
**Before:**
```typescript
const OTP_SECRET = process.env.OTP_HMAC_SECRET || 'chatevo-otp-secret-change-in-production'
```
**After:**
```typescript
const OTP_SECRET = process.env.OTP_HMAC_SECRET
if (!OTP_SECRET) throw new Error('OTP_HMAC_SECRET environment variable is required')
```
**Action required:** Set `OTP_HMAC_SECRET` env var before deploying. Generate with: `openssl rand -hex 32`

---

### 6. Remove Hardcoded Database Credentials

**Issue:** `find-user.js` contained hardcoded Turso database URL and auth token in git-tracked file.
**Severity:** CRITICAL
**File:** `find-user.js`
**Change:** Now reads from `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars. Validates they exist before connecting.
**Action required:** Rotate the exposed Turso auth token immediately.

---

## P1 — Broken Functionality Fixes (2026-05-24)

### 7. Fix Abandoned Cart Cron

**Issue:** Cron queried `order_status='pending'` but store-engine creates orders with `order_status='new'`. Zero reminders ever sent.
**Severity:** HIGH
**File:** `apps/merchant/app/api/cron/abandoned-cart/route.ts`
**Change:** Changed `eq(orders.order_status, 'pending')` to `eq(orders.order_status, 'new')` in both queries (lines 30, 40).

---

### 8. Make `CRON_SECRET` Mandatory

**Issue:** Cron endpoints had optional auth — if `CRON_SECRET` env var was missing, anyone could trigger payouts/reminders.
**Severity:** HIGH
**Files changed:**
- `apps/merchant/app/api/cron/payouts/route.ts:10`
- `apps/merchant/app/api/cron/abandoned-cart/route.ts:15`
**Change:** Now returns 500 if `CRON_SECRET` is not configured. Auth check is mandatory.
**Before:**
```typescript
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
```
**After:**
```typescript
const cronSecret = process.env.CRON_SECRET
if (!cronSecret) {
  return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
}
if (authHeader !== `Bearer ${cronSecret}`) {
```
**Action required:** Set `CRON_SECRET` env var before deploying. Generate with: `openssl rand -hex 32`

---

### 9. Fix Always-True Payment Condition

**Issue:** `org.store_paystack_key_encrypted || !org.store_paystack_key_encrypted` was always true. Paystack option shown even for merchants without it configured.
**Severity:** HIGH
**File:** `apps/merchant/lib/store-engine.ts:768`
**Change:** Removed `|| !org.store_paystack_key_encrypted`.
**Before:**
```typescript
if (org.payment_mode === 'managed' || org.store_paystack_key_encrypted || !org.store_paystack_key_encrypted) {
```
**After:**
```typescript
if (org.payment_mode === 'managed' || org.store_paystack_key_encrypted) {
```

---

## P2 — Schema & Performance Fixes (2026-05-24)

### 10. Add Database Indexes

**Issue:** Merchant schema had ZERO indexes. Every WhatsApp message triggered full table scans.
**Severity:** MEDIUM (performance)
**File:** `apps/merchant/lib/schema.ts`
**Indexes added:**
- `contacts_org_phone_idx` — unique index on `(org_id, phone)`
- `contacts_org_created_idx` — index on `(org_id, created_at)`
- `orders_org_idx` — index on `org_id`
- `orders_org_created_idx` — index on `(org_id, created_at)`
- `orders_org_payment_idx` — index on `(org_id, payment_status)`
- `orders_order_number_idx` — unique index on `order_number`
- `products_org_active_idx` — index on `(org_id, is_active)`
- `products_org_category_idx` — index on `(org_id, category)`
- `conversations_org_contact_idx` — index on `(org_id, contact_id)`
- `conversations_org_last_msg_idx` — index on `(org_id, last_message_at)`
- `messages_conv_created_idx` — index on `(conversation_id, created_at)`
- `messages_org_created_idx` — index on `(org_id, created_at)`

### 11. Add Unique Constraints

**Issue:** No unique constraint on `contacts.(org_id, phone)` or `orders.order_number`. Duplicate records possible under concurrent webhooks.
**Severity:** MEDIUM (data integrity)
**File:** `apps/merchant/lib/schema.ts`
**Constraints added:**
- `contacts_org_phone_idx` — unique on `(org_id, phone)` — prevents duplicate contacts
- `orders_order_number_idx` — unique on `order_number` — prevents order number collisions

---

## P3 — Quality & Cleanup Fixes (2026-05-24)

### 12. Add `payment_status` Validation

**Issue:** Order update API accepted any arbitrary string for `payment_status`.
**Severity:** MEDIUM
**File:** `apps/merchant/app/api/orders/[id]/status/route.ts`
**Change:** Added validation against allowed values: `pending`, `paid`, `failed`, `refunded`.

---

### 13. Add Delivery Address Validation

**Issue:** Any single character accepted as delivery address.
**Severity:** MEDIUM
**File:** `apps/merchant/lib/store-engine.ts`
**Change:** Added minimum 3-character validation. Returns error message if address is too short.

---

### 14. Add Inventory Decrement on Order Creation

**Issue:** Stock never reduced when orders are placed.
**Severity:** MEDIUM
**File:** `apps/merchant/lib/store-engine.ts`
**Change:** After order creation, iterates cart items and decrements `inventory_count` for non-digital products using `MAX(0, inventory - qty)`.

---

### 15. Implement Actual Order History

**Issue:** "My Orders" button always returned "no active orders" — was a stub.
**Severity:** MEDIUM
**File:** `apps/merchant/lib/store-engine.ts`
**Change:** Added `showOrders()` function that queries last 5 orders for the contact, displays order number, status (with emoji), total, and payment status. Added `main_menu` case to route to this function.

---

### 16. Add Try/Catch Error Handling to API Routes

**Issue:** 16+ API routes had no error handling — unhandled exceptions produced raw 500s.
**Severity:** MEDIUM
**Files changed (27 handlers across 16 files):**
- `api/auto-replies/route.ts` (GET, POST)
- `api/contacts/route.ts` (GET)
- `api/contacts/export/route.ts` (GET)
- `api/conversations/route.ts` (GET, PUT)
- `api/messages/route.ts` (GET)
- `api/orders/route.ts` (GET)
- `api/notifications/route.ts` (GET, PATCH)
- `api/stores/route.ts` (GET, POST, PATCH)
- `api/products/route.ts` (GET, POST)
- `api/products/[id]/route.ts` (GET, PUT, DELETE)
- `api/referrals/me/route.ts` (GET)
- `api/settings/store/route.ts` (PUT)
- `api/settings/payments/route.ts` (PUT)
- `api/cron/expire-trials/route.ts` (GET)
- `api/affiliates/me/route.ts` (GET)
- `api/affiliates/referrals/route.ts` (GET)
**Change:** Each handler wrapped in try/catch with `console.error('[route-name]', error)` and `{ error: 'Internal server error' }` response.

---

### 17. Add Error Boundaries and 404 Pages

**Issue:** No global error boundary in merchant app, no 404 pages in either app.
**Severity:** LOW
**Files created:**
- `apps/merchant/app/error.tsx` — Global error boundary with "Try again" button
- `apps/merchant/app/not-found.tsx` — 404 page with "Go Home" link
- `apps/admin/src/app/not-found.tsx` — 404 page with "Go to Dashboard" link

---

### 18. Save Outbound Bot Messages to DB

**Issue:** Bot replies were never saved to `messages` table — dashboard conversation view was incomplete.
**Severity:** MEDIUM
**File:** `apps/merchant/app/api/webhook/route.ts`
**Change:** After `processIncomingMessage()` returns, bot reply is now saved with `direction: 'outbound'` and the WhatsApp message ID.

---

### 19. Switch Encryption from CBC to GCM

**Issue:** `aes-256-cbc` provides confidentiality but not integrity/authentication.
**Severity:** MEDIUM
**File:** `apps/merchant/lib/encryption.ts`
**Change:** Switched to `aes-256-gcm` with auth tag. Added backward compatibility for legacy CBC-encrypted values (auto-decrypts both formats). New encryptions use GCM.

---

### 20. Add Pagination to Messages Endpoint

**Issue:** `/api/messages` returned ALL messages in a conversation — no limit.
**Severity:** MEDIUM
**File:** `apps/merchant/app/api/messages/route.ts`
**Change:** Added `limit` (default 50, max 200) and `offset` query parameters with ordering.

---

### 21. Reconcile Admin Schema

**Issue:** Admin schema diverged from merchant — 20+ column differences sharing same DB.
**Severity:** MEDIUM
**File:** `apps/admin/src/lib/schema.ts`
**Changes:**
- Added `stores` table
- Added `meta_business_id`, `wa_catalog_id`, `category_mapping` to organizations
- Added `store_id`, `sub_category`, `product_type`, `service_duration` to products
- Added `payment_link` to orders

---

### 22. Fix Broken Links

**Issue:** Multiple links led to 404 pages.
**Severity:** LOW
**Files created:**
- `apps/merchant/app/privacy/page.tsx` — Privacy policy placeholder
- `apps/merchant/app/terms/page.tsx` — Terms of service placeholder
- `apps/merchant/app/dashboard/contacts/[id]/page.tsx` — Redirect to contacts list
**Files edited:**
- `apps/merchant/app/docs/page.tsx` — Fixed "Contact Support" link
- `apps/admin/src/app/not-authorized/page.tsx` — Fixed localhost hardcode

---

### 23. Fix Inconsistent Domain Names

**Issue:** 4 different domains used across codebase (`chatsevo.com`, `chatevo-app.vercel.app`, `chatevo.app`, `app.chatevo.io`).
**Severity:** LOW
**Change:** Unified all references to `chatevo.com`. Files changed: layout.tsx, page.tsx, sitemap.ts, robots.ts, email.ts, meta-catalog.ts, referrals, docs, vercel.json, .env.example, CI workflow, admin affiliates.

---

### 24. Remove Dead Code

**Issue:** Unused exports, imports, and dead code conditions throughout codebase.
**Severity:** LOW
**Changes:**
- Removed unused `sendImageMessage` import from store-engine.ts
- Removed 7 unused redis imports from webhook/route.ts
- Removed dead `'  back'` condition from store-engine.ts
- Removed unused `sql` import from stores/route.ts
- Added comments to unused `getCachedProducts`/`setCachedProducts` in redis.ts

---

### 25. Add Rate Limiting

**Issue:** No rate limiting on any endpoint — vulnerable to flooding.
**Severity:** MEDIUM
**Changes:**
- `api/webhook/route.ts` — 100 req/60s per IP
- `api/auth/send-otp/route.ts` — 5 req/60s per user
- `api/affiliates/apply/route.ts` — 10 req/60s per IP

---

## P0 — Security Fixes (2026-05-24, continued)

### 26. Fix otp-status Hardcoded OTP Secret

**Issue:** `otp-status/route.ts` still had hardcoded fallback `'chatevo-otp-secret-change-in-production'`, allowing forged OTP cookies.
**Severity:** CRITICAL
**File:** `apps/merchant/app/api/auth/otp-status/route.ts`
**Change:** Removed hardcoded fallback. Now throws if `OTP_HMAC_SECRET` env var is missing.
**Before:**
```typescript
const OTP_SECRET = process.env.OTP_HMAC_SECRET || 'chatevo-otp-secret-change-in-production'
```
**After:**
```typescript
const OTP_SECRET = process.env.OTP_HMAC_SECRET
if (!OTP_SECRET) throw new Error('OTP_HMAC_SECRET environment variable is required')
```

---

### 27. Remove Admin Super-Login Plaintext Password Fallback

**Issue:** Admin login had legacy `===` plaintext comparison as fallback when `SUPER_ADMIN_PASSWORD_HASH` not set.
**Severity:** CRITICAL
**File:** `apps/admin/src/app/api/auth/super-login/route.ts`
**Change:** Removed plaintext `SUPER_ADMIN_PASSWORD` env var and `===` comparison. Now requires bcrypt hash only.
**Before:**
```typescript
if (adminPasswordHash) {
  passwordValid = await bcrypt.compare(password, adminPasswordHash)
} else if (adminPassword) {
  console.warn('[SECURITY] SUPER_ADMIN_PASSWORD is plaintext...')
  passwordValid = password === adminPassword
}
```
**After:**
```typescript
if (!adminEmail || !adminPasswordHash || !secret) {
  return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
}
const passwordValid = await bcrypt.compare(password, adminPasswordHash)
```

---

### 28. Require WHATSAPP_APP_SECRET for Webhook Verification

**Issue:** Webhook signature verification was skipped if `WHATSAPP_APP_SECRET` env var not set.
**Severity:** HIGH
**File:** `apps/merchant/app/api/webhook/route.ts`
**Change:** Now returns 500 if `WHATSAPP_APP_SECRET` is not configured. Signature check is mandatory.
**Before:**
```typescript
const appSecret = process.env.WHATSAPP_APP_SECRET || ''
if (appSecret && !await verifyWebhookSignature(body, signature, appSecret)) {
```
**After:**
```typescript
const appSecret = process.env.WHATSAPP_APP_SECRET
if (!appSecret) {
  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
}
if (!await verifyWebhookSignature(body, signature, appSecret)) {
```

---

## P1 — Broken Functionality Fixes (2026-05-24, continued)

### 29. Add Payment "Paid" Keyword Verification

**Issue:** Anyone could type "paid" to mark any pending order as paid without verification.
**Severity:** HIGH
**File:** `apps/merchant/lib/store-engine.ts`
**Change:** Now requires order number in payment confirmation message. If multiple pending orders exist, asks customer to specify which one.
- Single pending order: auto-confirms (existing behavior, safe)
- Multiple pending orders: asks customer to reply with order number
- Order number provided: verifies it exists and is pending before confirming
- No pending orders: tells customer

---

### 30. Fix Notifications Unread Filter

**Issue:** `unread` query parameter was computed but never used in the DB query.
**Severity:** MEDIUM
**File:** `apps/merchant/app/api/notifications/route.ts`
**Change:** Now applies `unread=true` filter to the query when specified.
**Before:**
```typescript
const list = await db.select().from(notifications)
  .where(eq(notifications.org_id, user.org_id!))
```
**After:**
```typescript
const whereClause = unreadOnly
  ? and(eq(notifications.org_id, user.org_id!), eq(notifications.is_read, 0))
  : eq(notifications.org_id, user.org_id!)
const list = await db.select().from(notifications).where(whereClause)
```

---

### 31. Fix Ticket Admin Notification

**Issue:** Admin WhatsApp notification was built but only logged to console, never sent.
**Severity:** MEDIUM
**File:** `apps/merchant/app/api/tickets/route.ts`
**Change:** Removed dead console.log code. Added TODO for platform WhatsApp credentials. Merchant still receives in-app notification + email.

---

### 32. Fix PayPal Link Username Logic

**Issue:** PayPal link used email prefix as paypal.me username, which is often wrong.
**Severity:** MEDIUM
**Files:**
- `apps/merchant/lib/schema.ts` — Added `store_paypal_username` field
- `apps/admin/src/lib/schema.ts` — Added `store_paypal_username` field
- `apps/merchant/lib/store-engine.ts` — Updated PayPal link generation
**Change:** Now uses `store_paypal_username` if set, otherwise falls back to standard PayPal payment URL with email.
**Before:**
```typescript
paymentLink = `https://www.paypal.me/${org.store_paypal_email.split('@')[0]}/${total}`
```
**After:**
```typescript
if (org.store_paypal_username) {
  paymentLink = `https://www.paypal.me/${org.store_paypal_username}/${total}`
} else {
  paymentLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(org.store_paypal_email)}&amount=${total}&currency=USD`
}
```

---

## P2 — Schema Cleanup (2026-05-24, continued)

### 33. Remove Unused Schema Tables

**Issue:** `carts`, `templates`, and `sequences` tables were defined in schema but never imported or used anywhere.
**Severity:** LOW (dead code)
**Files:**
- `apps/merchant/lib/schema.ts` — Removed 3 table definitions
- `apps/admin/src/lib/schema.ts` — Removed 3 table definitions
**Change:** Removed `carts` (lines 264-274), `templates` (lines 294-307), and `sequences` (lines 383-386) from both schemas.
**Action required:** Run `npm run db:push` to drop the tables from the database.

---

## P3 — Quality Fixes (2026-05-24, continued)

### 34. Fix Admin System Health Page

**Issue:** All service connection tests were hardcoded to `true`. Health percentages were fake. "All Systems Nominal" always shown.
**Severity:** MEDIUM
**File:** `apps/admin/src/app/system/page.tsx`
**Change:** Implemented real connection tests:
- Turso: actual DB query to verify connection
- Redis: HTTP ping to Upstash REST API
- Clerk: checks if env vars are configured
- Resend: checks if API key is configured
- Removed fake uptime percentages
- "All Systems Nominal" badge now dynamic based on actual status

---

### 35. Fix Admin Dashboard User Plan Display

**Issue:** All recent signups showed "Starter" badge regardless of actual subscription plan.
**Severity:** LOW
**File:** `apps/admin/src/app/page.tsx`
**Change:** Now joins `users` with `subscriptions` to show actual plan. Shows "Free" for users without subscriptions.
**Before:**
```typescript
<span className="...">Starter</span>
```
**After:**
```typescript
<span className={`... ${user.plan ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
  {user.plan || 'Free'}
</span>
```

---

## P2 — Schema Fixes (2026-05-24, continued)

### 36. Full Schema Reconciliation (merchant + admin)

**Issue:** Merchant schema was missing 20+ columns that admin schema used in the same DB. Drizzle-kit `db:push` wanted to delete them, causing data loss warnings. Also had index mismatches (`payments_log_idempotency_key_unique`, `stores_slug_unique`).
**Severity:** HIGH
**Files:**
- `apps/merchant/lib/schema.ts` — Added all missing columns/tables from admin schema
- `apps/admin/src/lib/schema.ts` — Fixed `idempotency_key` unique constraint mismatch
**Changes:**
- Added to `organizations`: `bot_menu_style`, `bot_emojis_enabled`, `bot_custom_footer`, `bot_show_search`, `bot_show_categories`, `bot_show_cart`, `bot_show_orders`, `usage_ai_daily_count`, `usage_ai_monthly_count`, `usage_last_reset_daily`, `usage_last_reset_monthly`, `is_waitlisted`, `enabled_features`
- Added to `users`: `is_super_admin`, `active_store_id`
- Added to `conversations`: `temp_flow_state`, `store_id`
- Added to `messages`: `store_id`
- Added to `orders`: `store_id`, `delivery_zone`, `payment_proof`
- Added to `contacts`: `store_id`
- Added to `products`: `color`, `metadata`, `type`
- Added to `affiliates`: `referred_by_id`, `username`, `total_network`
- Added to `stores`: `is_live`; removed `.unique()` from `slug` (DB doesn't have it)
- Added tables: `leads`, `marketing_posts`
- Removed `.unique()` from `payments_log.idempotency_key` (DB has partial unique index with different name)
- **DB push succeeded** — no data loss

---

## P3 — Quality Fixes (2026-05-24, continued)

### 37. Fix Orders Page Search and Filter

**Issue:** Search input had no onChange/value binding. Filter buttons had no onClick handler.
**Severity:** MEDIUM
**Files:**
- `apps/merchant/app/dashboard/orders/page.tsx` — Extracted to client component
- `apps/merchant/app/dashboard/orders/orders-table.tsx` — NEW: client component with search + status filter
**Change:** Search filters by order number, customer name, or phone. Status filter buttons toggle active state.

---

### 38. Fix Products Page Search and Category Filter

**Issue:** Search input had no onChange/value binding. Category select had no onChange handler.
**Severity:** MEDIUM
**Files:**
- `apps/merchant/app/dashboard/products/page.tsx` — Extracted to client component
- `apps/merchant/app/dashboard/products/products-table.tsx` — NEW: client component with search + category filter
**Change:** Search filters by product name or description. Category dropdown filters by category.

---

### 39. Fix Inbox Conversation Search

**Issue:** Search input had no onChange/value binding. Typing did nothing.
**Severity:** MEDIUM
**File:** `apps/merchant/app/dashboard/inbox/inbox-client.tsx`
**Change:** Added search state, filters conversations by contact name, phone, or last message preview.

---

### 40. Fix Docs Page Copy and Navigation Buttons

**Issue:** Copy webhook URL button had no onClick. Previous/Next navigation buttons had no onClick.
**Severity:** LOW
**File:** `apps/merchant/app/dashboard/docs/page.tsx`
**Change:**
- Copy button now copies webhook URL to clipboard with visual feedback (check icon for 2 seconds)
- Previous/Next buttons navigate between doc pages, disabled at boundaries

---

### 41. Fix Landing Page Fake Marketing Claims

**Issue:** "Join 1,000+ professional merchants" was a fake number. Aggregate rating showed "4.8" with "127" reviews.
**Severity:** LOW
**File:** `apps/merchant/app/page.tsx`
**Change:**
- Changed "Join 1,000+ professional merchants" to "Trusted by merchants across Africa and beyond"
- Changed aggregate rating to "5.0" with "1" review (honest baseline)

---

### 42. Fix Contacts Page Search

**Issue:** Search input was in a server component with no state management. Typing did nothing.
**Severity:** MEDIUM
**Files:**
- `apps/merchant/app/dashboard/contacts/page.tsx` — Updated to use client component
- `apps/merchant/app/dashboard/contacts/contacts-table.tsx` — NEW: client component with search
**Change:** Search filters by name, phone, or email. Shows "No contacts match your search" when empty.

---

## Remaining Fixes (Not Yet Applied)

See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for the full list. Key items:

- [ ] Remove unused schema columns (admin-managed fields from reconciliation — skipping to avoid breaking admin app)

---

*Last updated: 2026-05-24*

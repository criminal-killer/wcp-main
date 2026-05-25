# Chatevo Active Errors

**Last updated:** 2026-05-25

---

## CRITICAL — Blocking Deployment

### E-001: `error_logs` table missing `source` column in live database

**Vercel error:**
```
LibsqlError: SQLITE_UNKNOWN: SQLite error: table error_logs has no column named source
```

**What's happening:** We added `source` to the Drizzle schema (`apps/merchant/lib/schema.ts` line 549, `apps/admin/src/lib/schema.ts` line 128) but never ran `npm run db:push` against the live Turso database. Every `logError()` call fails because the DB column doesn't exist.

**Impact:** 
- Every API route that catches an error → tries to log it → fails → secondary error in Vercel logs
- The Vercel logs are flooded with these secondary errors, hiding real issues
- Error monitoring system is completely non-functional

**Fix needed:** Run `npm run db:push` from the merchant app to add the column to the live database:
```bash
cd apps/merchant
npm run db:push
```

This will execute: `ALTER TABLE error_logs ADD COLUMN source TEXT NOT NULL DEFAULT 'server'`

**Interim fix applied:** `error-logger.ts` now has a fallback — if the `source` column error occurs, it retries the insert without the `source` field.

---

### E-002: API routes rendered statically at build time

**Vercel error:**
```
Dynamic server usage: Route /api/affiliates/me couldn't be rendered statically because it used `headers`
```

**What's happening:** All API routes using Clerk `auth()` (which calls `headers()`) are being statically rendered during Vercel's build phase. The `headers()` function is a dynamic server function that can't be used in static rendering.

**Affected routes (28):** contacts, orders, messages, conversations, products, stores, affiliates, settings, auth, notifications, ai/chat, tickets, onboarding, referrals

**Fix applied:** Added `export const dynamic = 'force-dynamic'` as the first line of every API route file. This tells Next.js to always render these routes dynamically.

**Fix needed:** Rebuild and redeploy after the fix is committed.

---

### E-003: Error log cascade from E-001 + E-002 combined

**What's happening:**
1. Vercel tries to statically render `/api/affiliates/me` at build time
2. `auth()` → `headers()` throws "Dynamic server usage" error
3. Catch block calls `logError()` to log this error
4. `logError()` tries to insert with `source` column → column doesn't exist → secondary error
5. This repeats for every API route

**The Vercel logs show this pattern:**
```
[affiliates/me] Error: Dynamic server usage...
Failed to save error log: SQLite error: table error_logs has no column named source
[affiliates/referrals] Error: Dynamic server usage...
Failed to save error log: SQLite error: table error_logs has no column named source
[contacts/export] Error: Dynamic server usage...
Failed to save error log: SQLite error: table error_logs has no column named source
... (repeats for every route)
```

**Fix:** Both E-001 and E-002 must be fixed together. Once `force-dynamic` is deployed and `db:push` is run, these cascade errors will disappear.

---

## HIGH — WhatsApp Bot Flow

### E-004: Flow stops after product selection

**Symptom:** User selects a product from the product list, sees product detail, taps "Add to Cart" — nothing happens. No response from the bot.

**Possible causes (investigated):**
1. ✅ Product image URL validation — already has fallback (line 546: validates URL before sending)
2. ✅ Interactive message failure fallback — already sends plain text fallback (line 559)
3. ✅ 4-button quantity selectors — already fixed to 3 buttons (fix #59)
4. ⚠️ **Most likely cause:** The `source` column error (E-001) is causing the entire deployment to be in a broken state. If ANY error occurs during the flow, the error logging fails, and the cascade may affect the response.

**The flow code itself is correct.** The issue is likely the deployment being broken by E-001 + E-002. After fixing those and redeploying, test the flow again.

**If flow still stops after redeploy:**
- Check Vercel function logs for the specific WhatsApp API error
- The `sendInteractiveButtonMessage` may be failing silently if the image URL is invalid
- Add `console.log` in `handleProductAction` to trace exactly where execution stops

---

### E-005: WhatsApp messages look basic

**Status:** Design limitation of WhatsApp Cloud API

WhatsApp Cloud API supports:
- Text messages
- Interactive button messages (max 3 buttons)
- Interactive list messages (max 10 rows per section)
- CTA URL buttons
- Image/video/document headers

**Improvements possible:**
- Add product images to category/product list messages (image headers)
- Better formatting with emojis and line breaks (already done in current code)
- Use CTA URL buttons for payment links (already implemented)
- WhatsApp native catalog integration (requires Meta Commerce setup)

---

## MEDIUM — Non-blocking Issues

### E-006: ~~Unused `referrals/me/route.ts` imports~~ — VERIFIED CLEAN

**File:** `apps/merchant/app/api/referrals/me/route.ts`
**Status:** All imports are used (auth, db, users, organizations, logError, categorizeError). No stale imports.

### E-007: ~~Product `toLocaleString()` may fail for undefined/null prices~~ — FIXED

**File:** `apps/merchant/lib/store-engine.ts` — 10 locations used `price.toLocaleString()` without null check
**Fix applied:** All instances changed to `(price ?? 0).toLocaleString()` — covers product listings, product detail, variant select, quantity screen, cart, and edit item views

---

## RESOLVED (76 Fixes)

See [FIXES.md](./FIXES.md) for the complete list of 76 fixes applied across security, functionality, schema, quality, error monitoring, and admin panel categories.

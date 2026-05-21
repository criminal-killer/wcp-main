# Issues to Fix

## User Messages (This Session)

### 1. Payment flow wrong
> "the payment not what i said"

The payment implementation did not match what the user requested. Need to clarify expected payment flow (M-Pesa, Paystack link, manual confirmation, etc.).

### 2. WhatsApp chat UI unchanged
> "the whatsapp chat not showing the new design"
> "you said after ading the meta things the ui will chagnge i still see the same ui"

The Meta Commerce Catalog integration was marketed as having a UI impact, but it was purely backend (syncing products to Facebook catalog via Batch API). No WhatsApp chat interface changes occurred. User expected the WhatsApp bot messages to look/behave differently.

### 3. Flow is stuck / broken
> "still i get stck"
> "i still see the same ui that we had northing has changed"

Something in the WhatsApp bot flow is getting stuck — user cannot proceed through checkout. Need to test full flow:
- Greeting → Categories → Product → Add to Cart → Cart → Delivery → Payment

### 4. Things broken (regression)
> "you have again destroyrd many things not what i wanted"

Changes introduced regressions in previously working functionality. The flow fix (moving pay_link_/cancel/payment checks before !flow reset) and cart management overhaul (edit_item_N, edit_quantity) may have broken existing flow paths.

---

## What Was Done (and Rolled Back)

### Meta Catalog Integration (FULLY ROLLED BACK)
- `meta_business_id`, `wa_catalog_id`, `category_mapping` columns added to `organizations` in DB
- `lib/meta-catalog.ts` — Batch API sync service
- `app/docs/catalog-setup/page.tsx` — setup guide page
- `/api/products/[id]` — sync calls in PUT/DELETE
- `/api/products/` — sync call in POST
- `/api/settings/whatsapp` — accepts catalog fields
- Settings UI — Meta Business ID, WABA ID, Catalog ID fields
- `migrate-catalog.ts` — migration script

### Payment/Billing Changes (FULLY ROLLED BACK)
- `elite` plan renamed to `growth` in `payments.ts`
- Billing tab simplified in `settings-client.tsx`
- PLAN_LIMITS/CATEGORY_LIMITS updated in `products/route.ts`

### WhatsApp Flow Changes (FULLY ROLLED BACK)
- Flow fix: moved cancel/stop/exit, pay_link_, payment confirmation checks before flow reset
- Cart management: `edit_item_N` → `update_qty_N` / `remove_item_N` handlers
- `edit_quantity` flow step + `handleEditQuantity` function
- `handleVariantSelected` signature rename

### Current State After Rollback
- **Git**: Reset to `ee51e3a` (before Meta catalog commits)
- **DB**: Columns dropped from `organizations`
- **Backup**: Saved on `backup-meta-catalog` branch
- **Working tree**: Clean, no uncommitted changes

---

## Next (After Rollback Verification)
1. Fix WhatsApp flow bugs (greeting stuck, payment not working)
2. Implement payment exactly as user describes it
3. Add any UI improvements to WhatsApp bot messages
4. Deploy working version first, then add features incrementally

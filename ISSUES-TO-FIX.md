# Issues to Fix

## Status: ALL FIXED (2026-05-25)

### 1. Payment flow wrong ✅ FIXED
**Root cause:** `handlePaymentSelected()` defaulted to COD for any unrecognized text. Also, Paystack link failures created orphan orders with no way to pay.
**Fix:** Only accept `pay_paystack`/`pay_paypal`/`pay_cod`. Payment link failure returns error instead of creating order. (Fixes #60, #61)

### 2. WhatsApp chat flow gets stuck ✅ FIXED
**Root cause:** 4-button quantity selectors (1,2,3,5) exceeded WhatsApp's 3-button maximum. Meta API silently rejected messages — user saw nothing after "Add to Cart".
**Fix:** Reduced all quantity selectors to 3 buttons (1,2,3). (Fix #59)

### 3. Flow stuck / can't escape delivery screen ✅ FIXED
**Root cause:** In `delivery_info` state, ALL text was treated as an address. No way to go back.
**Fix:** Added escape handling: "back", "menu", "cart", "cancel" all work. (Fix #63)

### 4. Things broken (regressions) ✅ FIXED
**Root causes:**
- "menu" cleared the entire cart (destructive) → Now preserves cart, only "hi/hello/hey/start" clears
- "Main Menu" button from orders page not handled → Now calls showMainMenu
- AI fallback broken (Clerk auth required for server-to-server) → Direct Groq SDK call
- showOrders didn't set flow state → Now sets main_menu
- Duplicate setFlowState in showCart → Removed

See FIXES.md #59-#67 for full details.

### 5. Product selection silent failure ✅ FIXED (2026-05-25)
**Root cause:** After tapping a product from the list, `handleProductSelected` sent an interactive button message. If the body exceeded WhatsApp's 1024 char limit, the API silently dropped it. No fallback text was sent. Additionally, the webhook handler skipped the fallback when `processIncomingMessage` returned undefined.
**Fix:** Body truncated to 900 chars, entire send wrapped in try/catch with text fallback, webhook handles undefined results, catch block hardened. (Fixes #84-#86)

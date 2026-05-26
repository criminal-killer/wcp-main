# WhatsApp Features — Implemented & Future

## Implemented (Live)

### Interactive Buttons
- Browse, cart, checkout, quantity selection
- Image headers on product detail messages

### Interactive List Messages
- Category browsing, product selection, variant selection, cart editing
- Row titles auto-truncated to 24 chars (`waTitle()` helper)

### Product Carousels (with Meta Catalog)
- Up to 10 scrollable product cards with images, prices, descriptions
- Auto-enabled when `wa_catalog_id` + `meta_business_id` are set
- Falls back to list messages when catalog not configured
- **Setup guide:** [docs/SETUP_META_CATALOG.md](./SETUP_META_CATALOG.md)

### Two-step Greeting Flow
- "Hi" → greeting card → "Start Shopping" → main menu

### Cart & Checkout Flow
- Add to cart → quantity select → cart review → delivery info → payment

### AI Fallback
- Unrecognized messages → Groq AI response

---

## Future Enhancements

### 1. Subscription Expiry Redirect
**Status:** Not implemented — documented for future development

**What it does:** When a merchant's trial or paid subscription expires, the WhatsApp bot should:
1. Stop showing the full shopping flow
2. Send a message to the owner: "Your Chatevo subscription has expired. Renew to keep your store active."
3. Include a CTA button linking to the pricing page: `[Renew Plan]` → `https://chatevo.com/pricing`
4. For customers messaging the store: "This store is temporarily unavailable. Please check back later."

**Implementation notes:**
- Check `organizations.subscription_status` and `organizations.trial_ends_at` in `processIncomingMessage`
- If expired → send expiry message with CTA URL instead of processing the flow
- Use `sendInteractiveCTAUrlMessage` for the "Renew Plan" button
- Don't implement yet — user wants WhatsApp flow stable first

### 2. WhatsApp Flows (Multi-Screen Forms)
**Status:** Not implemented

WhatsApp Flows enable structured multi-screen interactions within WhatsApp:
- Appointment booking
- Lead generation forms
- Structured address collection (better than free-text)
- Product browsing in a flow

**Setup:** Meta Business Suite → WhatsApp → Flows

### 3. Template Messages (HSM)
**Status:** Not implemented

Pre-approved message templates for:
- Order confirmations
- Shipping updates
- Abandoned cart reminders
- Promotional broadcasts

**Requirement:** Templates must be approved by Meta before sending.

### 4. Media Messages
**Status:** Not implemented

Send images, videos, documents:
- Product photos as standalone images
- Invoice PDFs
- Video product demos

### 5. Location Messages
**Status:** Not implemented

- Store location sharing
- Delivery tracking with map

### 6. Contact Cards
**Status:** Not implemented

- Share business contact info
- Agent contact cards

---

## Architecture Notes

### How Carousels Work (Implemented)

```
User taps category
  → handleCategorySelected()
  → if hasCatalog(org): sendCarouselMessage() with product images
  → else: sendInteractiveListMessage() with text rows

User taps carousel card
  → WhatsApp sends interactive.product_item.product_retailer_id
  → parseInput() extracts "prod_XXX"
  → handleProductSelected() shows product detail with buttons
```

### How Subscription Expiry Would Work (Future)

```
User sends any message
  → processIncomingMessage()
  → check org.subscription_status and org.trial_ends_at
  → if expired:
    → sendInteractiveCTAUrlMessage("Renew Plan", "https://chatevo.com/pricing")
    → return (don't process flow)
  → else: continue normal flow
```

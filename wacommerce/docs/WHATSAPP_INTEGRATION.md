# WhatsApp Integration Guide
# CHATEVO

---

## 1. Overview

Chatevo uses Meta's Cloud API (official WhatsApp Business Platform).
Each store owner connects THEIR OWN WhatsApp Business Account.
Meta handles message delivery. Chatevo provides the software layer.

**Key Concept:**
- Store owner has their own Meta Business Account
- Store owner has their own WhatsApp Business Phone Number
- Store owner's access token is stored (encrypted) in Chatevo
- Chatevo sends/receives messages using the store owner's credentials
- Meta charges the STORE OWNER per conversation (not Chatevo)

---

## 2. Setup Flow (For Store Owner)

### Step 1: Meta Business Account
Store owner goes to `business.facebook.com` and creates a Meta Business Account (free).

### Step 2: WhatsApp Business Account
Inside Meta Business Suite, store owner adds WhatsApp product:
- Gets WhatsApp Business Account ID (WABA ID)
- Adds a phone number (gets Phone Number ID)
- Gets a permanent access token via System User

### Step 3: Connect to Chatevo
In Chatevo Dashboard → Settings → WhatsApp:
- Paste Phone Number ID
- Paste Access Token
- Click "Test Connection" (sends test message to verify)
- If successful: saved (encrypted) to database

### Step 4: Webhook Configuration
Store owner adds webhook URL in Meta Developer Console:
- Webhook URL: `https://app.chatevo.io/api/webhook`
- Verify Token: (from Chatevo settings)
- Subscribe to: `messages`, `message_deliveries`, `message_reads`

---

## 3. Webhook Handling

### Verification (GET /api/webhook)
Meta sends: `GET /api/webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=123`
Chatevo checks: `hub.verify_token === process.env.WHATSAPP_VERIFY_TOKEN`
If match: respond with `hub.challenge` (plain text, 200)
If no match: respond 403

### Incoming Messages (POST /api/webhook)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "254700000000",
          "phone_number_id": "123456789"
        },
        "contacts": [{
          "profile": { "name": "John Doe" },
          "wa_id": "254712345678"
        }],
        "messages": [{
          "from": "254712345678",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": { "body": "Hi" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Processing Flow:**
1. Extract `phone_number_id` from metadata
2. Find organization: `SELECT * FROM organizations WHERE wa_phone_number_id = ?`
3. If org not found → ignore (log warning)
4. Extract customer phone, name, message
5. Upsert contact in `contacts` table
6. Find or create conversation
7. Save inbound message to `messages` table
8. Process through store-engine
9. Store-engine generates response(s)
10. Send response(s) via Meta API
11. Save outbound message(s) to `messages` table
12. Update `conversation.last_message_at`

### Status Updates
```json
{
  "statuses": [{
    "id": "wamid.xxx",
    "status": "delivered",
    "timestamp": "1234567890",
    "recipient_id": "254712345678"
  }]
}
```
**Processing:** `UPDATE messages SET status = ? WHERE wa_message_id = ?`

## 4. Sending Messages

### Text Message
```url
POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
Authorization: Bearer {access_token}
```
```json
{
  "messaging_product": "whatsapp",
  "to": "254712345678",
  "type": "text",
  "text": { "body": "Hello! Welcome to our store." }
}
```

### Image Message
```json
{
  "messaging_product": "whatsapp",
  "to": "254712345678",
  "type": "image",
  "image": {
    "link": "https://example.com/product.jpg",
    "caption": "Blue T-Shirt — KES 1,500"
  }
}
```

### Interactive Button Message
```json
{
  "messaging_product": "whatsapp",
  "to": "254712345678",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Welcome to Amani Fashion! 👋\nHow can I help you?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "shop", "title": "🛍️ Shop Now" } },
        { "type": "reply", "reply": { "id": "track", "title": "📦 Track Order" } },
        { "type": "reply", "reply": { "id": "human", "title": "💬 Talk to Us" } }
      ]
    }
  }
}
```

### Interactive List Message
```json
{
  "messaging_product": "whatsapp",
  "to": "254712345678",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Browse our categories:" },
    "action": {
      "button": "View Categories",
      "sections": [{
        "title": "Categories",
        "rows": [
          { "id": "cat_clothing", "title": "👕 Clothing", "description": "T-shirts, dresses, jeans" },
          { "id": "cat_shoes", "title": "👟 Shoes", "description": "Sneakers, heels, boots" },
          { "id": "cat_accessories", "title": "🎒 Accessories", "description": "Bags, jewelry, watches" }
        ]
      }]
    }
  }
}
```

## 5. Store Engine — Shopping Flow
The store-engine (`lib/whatsapp/store-engine.ts`) handles the complete in-chat shopping experience.

### State Management
Customer's current position in the flow is tracked via Redis:

- **Key:** `chatevo:flow:{org_id}:{phone}`
- **Value:** `{ "step": "browsing_category", "category": "Clothing", "cart_id": "..." }`
- **TTL:** 30 minutes

### Flow States
- `IDLE` → customer sends any message
- `WELCOME` → show welcome + menu buttons
- `BROWSING_CATEGORIES` → show category list
- `BROWSING_PRODUCTS` → show products in category
- `VIEWING_PRODUCT` → show product detail + variant selection
- `SELECTING_VARIANT` → add to cart
- `VIEWING_CART` → show cart summary + pay/continue/clear
- `CHECKOUT` → select payment method
- `PAYMENT` → show payment link
- `ORDER_CONFIRMED` → confirmation message

### Keyword Triggers (Reset to specific state)
| Keywords | Action |
|----------|--------|
| `hi`, `hello`, `hey`, `start` | Welcome message |
| `shop`, `menu`, `browse`, `products` | Categories |
| `cart`, `basket` | Show cart |
| `order`, `track`, `status` | Ask for order number |
| `help`, `human`, `agent`, `support` | Hand off to human |
| `cancel` | Clear cart |

## 6. Template Messages
For sending messages OUTSIDE the 24-hour window:

### Creating Templates
Templates must be submitted to Meta for approval.
Store owner creates template in Chatevo dashboard → Chatevo submits via API → Meta reviews (1-24 hours).

### Sending Template Messages
```json
{
  "messaging_product": "whatsapp",
  "to": "254712345678",
  "type": "template",
  "template": {
    "name": "order_confirmation",
    "language": { "code": "en" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "ORD-2025-0001" },
        { "type": "text", "text": "KES 1,700" }
      ]
    }]
  }
}
```

## 7. Rate Limits
Meta's rate limits:
- **Standard:** 80 messages/second per phone number
- **Business-initiated:** varies by quality rating and tier
- **Chatevo adds buffer:** send max 10 messages/second per org

## 8. 24-Hour Window Rule
- When customer messages you → 24-hour window opens
- Within window: send ANY message (text, image, interactive)
- After window closes: must use approved TEMPLATE messages
- Template messages cost money (paid by store owner to Meta)
- Service conversations (customer-initiated): first 1,000/month FREE

## 9. Error Handling
| Error Code | Meaning | Action |
|------------|---------|--------|
| 131026 | Message not delivered | Retry once after 5 seconds |
| 131047 | Re-engagement required | Need template message |
| 131051 | Unsupported message type | Fallback to text |
| 130429 | Rate limited | Queue and retry after 60 seconds |
| 131031 | Account locked | Alert store owner |
| 100 | Invalid parameter | Log and fix |

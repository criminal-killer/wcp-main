# API Design
# SELLA — WhatsApp Commerce Platform

---

## 1. API Overview

All APIs are Next.js API Routes (serverless functions on Vercel).
Base URL: `https://app.sella.io/api` (production) or `http://localhost:3000/api` (dev)

### Authentication
- Dashboard APIs: Clerk JWT via `auth()` — extracts userId and orgId
- Admin APIs: Clerk JWT + ADMIN_USER_ID check
- Public APIs: No auth (webhook, store, payment webhooks)
- Webhook APIs: Signature verification (Meta, Paystack, Stripe)

### Multi-Tenant
Every authenticated request is scoped to the user's organization.
`orgId` comes from Clerk session, NOT from request body/params.
All DB queries include `WHERE org_id = orgId`.

### Response Format
```json
// Success
{ "data": {...}, "message": "Product created" }

// Success (list)
{ "data": [...], "total": 25, "page": 1, "limit": 20 }

// Error
{ "error": "Product not found", "code": "NOT_FOUND" }
```

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (wrong org or not admin) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

## 2. Products API

### GET /api/products
List all products for the authenticated org.

**Auth:** Required (Clerk)

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | — | Filter by category |
| search | string | — | Search by name |
| active | boolean | — | Filter by active status |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response 200:**
```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Blue T-Shirt",
      "description": "Premium cotton t-shirt",
      "price": 1500,
      "compare_at_price": 2000,
      "currency": "KES",
      "category": "Clothing",
      "images": ["https://..."],
      "variants": [{"type": "size", "options": ["S","M","L","XL"]}],
      "inventory_count": 25,
      "is_active": 1,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

### POST /api/products
Create a new product.

**Auth:** Required

**Body:**
```json
{
  "name": "Blue T-Shirt",
  "description": "Premium cotton",
  "price": 1500,
  "compare_at_price": 2000,
  "category": "Clothing",
  "images": ["https://example.com/img.jpg"],
  "variants": [{"type": "size", "options": ["S","M","L"]}],
  "inventory_count": 25
}
```

**Validation (Zod):**
```typescript
const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional(),
  category: z.string().min(1).max(100).default('General'),
  images: z.array(z.string().url()).max(5).default([]),
  variants: z.array(z.object({
    type: z.string(),
    options: z.array(z.string()),
  })).default([]),
  inventory_count: z.number().int().min(0).default(0),
})
```

**Checks:**
- Plan limit: count existing products, reject if at limit
- Category limit: count distinct categories, reject if at limit

**Response 201:**
```json
{
  "data": { "id": "abc123", ...product },
  "message": "Product created"
}
```

### GET /api/products/[id]
Get single product by ID.
**Auth:** Required
**Checks:** Product must belong to user's org
**Response 200:** `{ "data": {...product} }`
**Response 404:** `{ "error": "Product not found" }`

### PUT /api/products/[id]
Update a product.
**Auth:** Required
**Body:** Same as POST (all fields optional)
**Checks:** Product must belong to user's org
**Side Effect:** Clear Redis cache for org's products
**Response 200:** `{ "data": {...updated}, "message": "Product updated" }`

### DELETE /api/products/[id]
Soft-delete a product (set `is_active = 0`).
**Auth:** Required
**Checks:** Product must belong to user's org
**Response 200:** `{ "message": "Product deleted" }`

## 3. Orders API

### GET /api/orders
List orders for the authenticated org.
**Auth:** Required

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by order_status |
| payment | string | Filter by payment_status |
| search | string | Search by order_number or customer name |
| page | number | Page number |
| limit | number | Items per page |

**Response 200:**
```json
{
  "data": [
    {
      "id": "ord123",
      "order_number": "ORD-2025-0001",
      "items": [{"product_id":"abc","name":"T-Shirt","price":1500,"quantity":1,"variant":"L"}],
      "subtotal": 1500,
      "delivery_fee": 200,
      "discount": 0,
      "total": 1700,
      "currency": "KES",
      "payment_method": "mpesa",
      "payment_status": "paid",
      "order_status": "new",
      "created_at": "2025-01-15T14:30:00Z",
      "contact": {
        "id": "con123",
        "name": "John Doe",
        "phone": "+254712345678"
      }
    }
  ],
  "total": 120
}
```

### POST /api/orders
Create an order (usually called internally by store-engine after payment).
**Auth:** Required OR internal (from webhook)

**Body:**
```json
{
  "contact_id": "con123",
  "items": [{"product_id":"abc","name":"T-Shirt","price":1500,"quantity":1,"variant":"L"}],
  "subtotal": 1500,
  "delivery_fee": 200,
  "total": 1700,
  "payment_method": "mpesa",
  "delivery_address": "123 Main St, Nairobi"
}
```

**Side Effects:**
- Auto-generate `order_number`
- Update `contact.total_orders` and `contact.total_spent`
- Decrement product inventory
- Send WhatsApp notification to store owner

### GET /api/orders/[id]
Get order detail with contact info.
**Auth:** Required
**Response 200:** Full order object with nested contact

### PUT /api/orders/[id]/status
Update order status and notify customer.
**Auth:** Required

**Body:**
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456"
}
```

**Side Effects:**
- Update `order_status` in DB
- Send WhatsApp message to customer:
  - `confirmed`: "✅ Your order is confirmed!"
  - `shipped`: "📦 Your order has shipped! Track: {link}"
  - `delivered`: "🎉 Your order was delivered!"
  - `cancelled`: "❌ Your order was cancelled."

## 4. Contacts API

### GET /api/contacts
List contacts.
**Auth:** Required
**Query Params:** `search` (name/phone), `tag`, `page`, `limit`
**Response 200:** Array of contacts with order stats

### GET /api/contacts/[id]
Contact detail with order history.
**Auth:** Required
**Response 200:** Contact + recent orders array

### PUT /api/contacts/[id]
Update contact (tags, notes, name).
**Auth:** Required
**Body:** `{ "tags": ["VIP"], "notes": "Wholesale buyer" }`

## 5. Conversations & Messages API

### GET /api/conversations
List conversations for org, sorted by `last_message_at desc`.
**Auth:** Required
**Query Params:** `status` (open/closed/pending)
**Response 200:** Array of conversations with nested contact info

### GET /api/messages?conversation_id=xxx
Get messages for a conversation.
**Auth:** Required
**Query Params:** `conversation_id` (required), `page`, `limit`
**Response 200:** Array of messages sorted by `created_at asc`

### POST /api/messages/send
Send a message from dashboard to customer.
**Auth:** Required

**Body:**
```json
{
  "conversation_id": "conv123",
  "contact_id": "con123",
  "content": "Hi! Your order is ready.",
  "message_type": "text"
}
```

**Side Effects:**
- Send via Meta Cloud API using org's WhatsApp credentials
- Save outbound message to DB
- Update `conversation.last_message_at`

## 6. Auto-Replies API

### GET /api/auto-replies
List all auto-replies for org.

### POST /api/auto-replies
Create auto-reply.
**Body:**
```json
{
  "type": "keyword",
  "keyword": "delivery",
  "response": "We deliver within Nairobi in 2-3 business days. Delivery fee: KES 200."
}
```

### PUT /api/auto-replies/[id]
Update auto-reply.

### DELETE /api/auto-replies/[id]
Delete auto-reply.

## 7. Cart API

### GET /api/cart?contact_phone=xxx&org_id=xxx
Get cart for a customer. Used by store-engine.

### POST /api/cart
Add/remove/clear cart items.
**Body:**
```json
{
  "action": "add",
  "contact_id": "con123",
  "item": {"product_id":"abc","name":"T-Shirt","price":1500,"quantity":1,"variant":"L"}
}
```
**Actions:** `add`, `remove`, `clear`, `get`

## 8. Payment APIs

### POST /api/payments/subscribe
Create subscription checkout for Sella SaaS.
**Auth:** Required
**Body:**
```json
{
  "plan": "starter",
  "provider": "paystack"
}
```
**Response:** `{ "checkout_url": "https://paystack.com/pay/..." }`

### POST /api/payments/subscribe-webhook
Handle subscription payment confirmation.
**Auth:** Webhook signature verification
**Providers:** Paystack, Stripe, PayPal
**Side Effect:** Update `org.plan`, `org.subscription_id`

### POST /api/payments/store-checkout
Create payment link for store customer purchase.
**Auth:** Internal (from store-engine)
**Body:**
```json
{
  "org_id": "org123",
  "order_id": "ord123",
  "amount": 1700,
  "currency": "KES",
  "customer_email": "buyer@email.com",
  "customer_phone": "+254712345678"
}
```
**Response:** `{ "payment_url": "https://paystack.com/pay/..." }`
Uses STORE OWNER's payment credentials.

### POST /api/payments/store-webhook
Handle store sale payment confirmation.
**Auth:** Webhook signature verification
**Side Effects:**
- Update `order.payment_status = "paid"`
- Update contact stats
- Send WhatsApp confirmation to customer
- Send WhatsApp notification to store owner

## 9. WhatsApp Webhook API

### GET /api/webhook
Meta webhook verification.
**Query Params:** `hub.mode`, `hub.verify_token`, `hub.challenge`
**Logic:** If `verify_token` matches env var, return `challenge`.

### POST /api/webhook
Process incoming WhatsApp events.
**Auth:** Webhook signature (`WHATSAPP_APP_SECRET`)
**Events:**
- `messages` → Process through store-engine
- `statuses` → Update message status in DB

## 10. Store API (Public)

### GET /api/store/[slug]
Get public store info.
**Auth:** None (public)
**Response:** Store name, description, logo, theme_color, products, categories

### GET /api/store/[slug]/products
Get products for public store page.
**Auth:** None (public)
**Query Params:** `category`
**Response:** Active products with images and prices

## 11. Admin APIs
All admin APIs check `userId === process.env.ADMIN_USER_ID`.

### GET /api/admin/stats
Platform-wide statistics.
**Response:**
```json
{
  "total_users": 247,
  "active_subscribers": 89,
  "mrr": 3451,
  "signups_today": 5,
  "signups_this_week": 23,
  "signups_this_month": 87,
  "users_by_plan": {"trial": 45, "free": 113, "starter": 67, "growth": 18, "premium": 4},
  "users_by_country": {"KE": 102, "NG": 65, "GH": 23}
}
```

### GET /api/admin/users
All users with org info.

### PUT /api/admin/users/[id]
Update user plan, status, etc.

### GET /api/admin/waitlist
All waitlist entries.

### POST /api/admin/waitlist
Bulk import waitlist from CSV.

### POST /api/admin/waitlist/migrate
Migrate waitlist entries to real user accounts.

### POST /api/admin/notify
Send bulk email/WhatsApp notification.
**Body:**
```json
{
  "channel": "email",
  "segment": "all",
  "subject": "Sella is live!",
  "message": "Your account is ready..."
}
```

## 12. Onboarding API

### POST /api/onboarding
Create organization after signup.
**Auth:** Required (Clerk)
**Body:**
```json
{
  "name": "Amani Fashion",
  "country": "KE",
  "business_type": "Fashion & Clothing"
}
```

**Side Effects:**
- Generate slug from name
- Set currency + timezone from country
- Set `trial_ends_at` to 14 days from now
- Generate `referral_code`
- Create user record linked to Clerk
- Send welcome email

## 13. Upload API

### POST /api/upload
Upload product image.
**Auth:** Required
**Body:** `FormData` with file
**Response:** `{ "url": "https://..." }`
**Storage:** Vercel Blob (free tier) or return external URL

## 14. Cron APIs

### GET /api/cron/trial-check
Check for expired trials, downgrade to free plan.
**Auth:** Vercel Cron (`CRON_SECRET` header)
**Schedule:** Daily at midnight UTC
**Logic:** Find orgs `WHERE plan = 'trial' AND trial_ends_at < now()` → set `plan = 'free'`

### GET /api/cron/reminders
Send abandoned cart reminders.
**Auth:** Vercel Cron
**Schedule:** Every 6 hours
**Logic:** Find carts older than 1 hour → send WhatsApp reminder

## 15. Rate Limiting
Using Upstash Redis:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Dashboard APIs | 100 req | 1 minute |
| Webhook (WhatsApp) | 500 req | 1 minute |
| Auth endpoints | 10 req | 1 minute |
| Admin APIs | 50 req | 1 minute |
| Public store | 200 req | 1 minute |

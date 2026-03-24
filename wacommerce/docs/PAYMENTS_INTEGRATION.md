# Payments Integration
# SELLA

---

## 1. Two Payment Streams

### Stream 1: SaaS Subscription (Store Owner → Sella)
Store owners pay Sella monthly ($29/$59/$99).
Money goes to SELLA's payment accounts.

### Stream 2: Store Sales (End Customer → Store Owner)
End customers pay for products they buy.
Money goes to STORE OWNER's payment accounts.
SELLA NEVER TOUCHES THIS MONEY.

---

## 2. Supported Payment Providers

| Provider | Regions | Methods | Use Case |
|----------|---------|---------|----------|
| Paystack | Kenya, Nigeria, Ghana, South Africa, Egypt, Rwanda, Côte d'Ivoire | M-Pesa, Cards, Bank Transfer, USSD, Mobile Money | Africa primary |
| Stripe | 47+ countries (US, UK, EU, India, Singapore, etc.) | Cards, Apple Pay, Google Pay, SEPA, iDEAL | Global primary |
| PayPal | 200+ countries | PayPal balance, Cards via PayPal | Universal backup |

---

## 3. Stream 1: SaaS Subscription

### Flow
Store owner clicks "Subscribe" on billing page
↓
Frontend detects country (IP or from `org.country`)
↓
Africa → Show Paystack checkout
Global → Show Stripe checkout
Any → Show PayPal option
↓
`POST /api/payments/subscribe { plan: "starter", provider: "paystack" }`
↓
API creates checkout session with Sella's credentials
↓
Returns `checkout_url` → redirect store owner
↓
Store owner pays
↓
Provider sends webhook to `/api/payments/subscribe-webhook`
↓
Verify signature → update `org.plan` → send welcome email

### Paystack Subscription Setup
Sella Paystack Dashboard:
- Create Plan: "Sella Starter" → $29/month → plan_code: `PLN_xxx`
- Create Plan: "Sella Growth" → $59/month → plan_code: `PLN_yyy`
- Create Plan: "Sella Premium" → $99/month → plan_code: `PLN_zzz`

### Paystack Subscription API
```url
POST https://api.paystack.co/transaction/initialize
Authorization: Bearer sk_live_xxx (SELLA's key)
```
```json
{
"email": "storeowner@email.com",
"amount": 2900, // $29 in cents
"currency": "USD",
"plan": "PLN_xxx",
"callback_url": "https://app.sella.io/dashboard/settings/billing?success=true",
"metadata": {
"org_id": "org_123",
"plan": "starter"
}
}
```

### Stripe Subscription
```typescript
const session = await stripe.checkout.sessions.create({
mode: 'subscription',
line_items: [{
price: 'price_xxx', // Stripe Price ID for Starter
quantity: 1,
}],
success_url: 'https://app.sella.io/dashboard/settings/billing?success=true',
cancel_url: 'https://app.sella.io/dashboard/settings/billing?cancelled=true',
metadata: { org_id: 'org_123', plan: 'starter' },
customer_email: 'storeowner@email.com',
})
```

### Webhook Processing (/api/payments/subscribe-webhook)
1. Read raw body
2. Detect provider from headers:
   - `x-paystack-signature` → Paystack
   - `stripe-signature` → Stripe
3. Verify signature
4. Extract event type:
   - Paystack: `charge.success` → subscription active
   - Stripe: `checkout.session.completed` → subscription active
   - Stripe: `customer.subscription.deleted` → subscription cancelled
5. Find org from `metadata.org_id`
6. Update org:
   - `plan` = `metadata.plan`
   - `subscription_id` = provider reference
   - `payment_provider` = "paystack" | "stripe" | "paypal"
7. Log to `payments_log` table (type: "subscription")

---

## 4. Stream 2: Store Sales

### Setup (Store Owner configures their payment accounts)

In Dashboard → Settings → Payments:

**Paystack:**
- Store owner creates their own Paystack account at `paystack.com`
- Enters their Paystack Public Key and Secret Key in Sella
- Keys are encrypted before storing in database

**Stripe:**
- Store owner connects via Stripe Connect (OAuth)
- Sella stores their Stripe Account ID
- Uses Stripe Connect to create payments on their behalf

**PayPal:**
- Store owner enters their PayPal business email
- Payment links direct to `PayPal.me` or PayPal checkout

**M-Pesa (Kenya):**
- Store owner enters their M-Pesa Till Number or Paybill
- Integrated via Paystack (which supports M-Pesa in Kenya)

**Cash on Delivery:**
- Just a toggle: enabled/disabled
- No configuration needed

**Bank Transfer:**
- Store owner enters bank name, account number, account name
- Displayed to customer as instructions (manual verification)

### Store Payment Flow
Customer clicks "Pay Now" in WhatsApp
↓
Store-engine calls `POST /api/payments/store-checkout`
↓
API looks up store owner's payment credentials (decrypted)
↓
Creates payment link using STORE OWNER's keys:
- Has Paystack? → Paystack payment link
- Has Stripe? → Stripe checkout session
- Has PayPal? → PayPal order
- Only COD? → Mark order as COD, skip payment
↓
Returns payment URL
↓
Store-engine sends payment link to customer via WhatsApp:
"💳 Pay KES 1,700:
👉 https://paystack.com/pay/sella-ord-001
⏰ This link expires in 30 minutes"
↓
Customer pays
↓
Payment provider webhook → `POST /api/payments/store-webhook`
↓
Verify signature using STORE OWNER's secret key
↓
Update order:
- `payment_status` = "paid"
- `payment_reference` = provider_reference
- `payment_provider` = "paystack"
↓
Update contact: `total_orders += 1`, `total_spent += amount`
↓
Send WhatsApp to customer: "✅ Payment received! Order #ORD-2025-0001"
Send WhatsApp to store owner: "🛒 New paid order! ORD-2025-0001 — KES 1,700"
↓
Money lands in STORE OWNER's Paystack/Stripe/PayPal account
Sella NEVER touches this money

### Paystack Store Payment
```url
POST https://api.paystack.co/transaction/initialize
Authorization: Bearer {STORE_OWNER_SECRET_KEY} // decrypted
```
```json
{
"email": "customer@email.com",
"amount": 170000, // KES 1,700 in kobo/cents
"currency": "KES",
"reference": "sella-ord-2025-0001",
"callback_url": "https://app.sella.io/api/payments/store-webhook",
"metadata": {
"org_id": "org_123",
"order_id": "ord_456",
"customer_phone": "+254712345678"
}
}
```

---

## 5. Webhook Security

### Paystack Signature Verification
```typescript
import crypto from 'crypto'

function verifyPaystackSignature(body: string, signature: string, secretKey: string): boolean {
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

### Stripe Signature Verification
```typescript
import Stripe from 'stripe'

function verifyStripeWebhook(body: string, signature: string, webhookSecret: string) {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}
```

## 6. Currency Handling
- Each org has a default currency (set during onboarding)
- Product prices stored in org's currency
- Payment links created in org's currency
- Paystack supports: NGN, GHS, ZAR, KES, USD
- Stripe supports: 135+ currencies
- PayPal supports: 25 currencies

## 7. Fees
| Provider | Local | International |
|----------|-------|---------------|
| Paystack (Kenya) | 1.5% + KES 30 | 3.9% + KES 100 |
| Paystack (Nigeria) | 1.5% + ₦100 | 3.9% + ₦100 |
| Stripe | 2.9% + $0.30 | Varies |
| PayPal | 2.9% + $0.30 | 4.4% + fixed |

These fees are paid by the STORE OWNER to the payment provider.
Sella adds ZERO additional fees.

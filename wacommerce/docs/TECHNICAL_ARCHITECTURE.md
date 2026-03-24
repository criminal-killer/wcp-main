# Technical Architecture
## SELLA

---

### 1. System Overview
┌─────────────────────────────────────────────────────┐
│ CLIENTS                                             │
│                                                     │
│ Store Owner               End Customer              │
│ (Dashboard)               (WhatsApp)                │
│       │                         │                   │
│       │ HTTPS                   │ WhatsApp Protocol │
│       ▼                         ▼                   │
│ ┌────────┐                ┌──────────┐              │
│ │ VERCEL │                │ META     │              │
│ │Next.js │                │ CLOUD API│              │
│ │Frontend│                │          │              │
│ │ +API   │◄───────────────│ Webhooks │              │
│ └───┬────┘                └──────────┘              │
│     │                                               │
│ ┌───┴──────────────────────────────┐                │
│ │ API LAYER                        │                │
│ │ Next.js API Routes               │                │
│ │ (Serverless Functions)           │                │
│ └┬────┬────┬────┬────┬────┬──────┘                │
│  │    │    │    │    │    │    │                  │
│  ▼    ▼    ▼    ▼    ▼    ▼    ▼                  │
│ Turso Clerk  Groq  Pay  Red  Res                    │
│ (DB) (Auth)(AI) (Pay)(Cch)(Eml)                    │
└─────────────────────────────────────────────────────┘

### 2. Tech Stack Details

#### Frontend: Next.js 14 (App Router)
- **Why:** Full-stack framework, server components, API routes, 
  deployed on Vercel for free
- **UI:** Tailwind CSS + shadcn/ui (pre-built components)
- **State:** React hooks + URL state (no Redux needed)
- **Forms:** React Hook Form + Zod validation

#### Database: Turso (libSQL / SQLite)
- **Why:** 9GB free tier (vs 500MB Supabase), edge-deployed, 
  globally fast, SQLite compatibility
- **ORM:** Drizzle ORM (type-safe, lightweight)
- **Connection:** libsql client via HTTPS
- **Multi-tenant:** Every table has org_id column, 
  every query filtered by org_id

#### Authentication: Clerk
- **Why:** 10K free users, pre-built UI components, 
  organizations (multi-tenant), roles, webhooks
- **Flow:** Clerk handles all auth UI and logic
- **Integration:** @clerk/nextjs middleware protects routes
- **Roles:** owner, admin, agent (per organization)

#### AI: Groq (Primary) + Google Gemini (Backup)
- **Why Groq:** Free, fastest inference (< 1 second), 
  Llama 3.1 70B quality
- **Why Gemini:** Free backup, better translation, 
  large context window
- **Fallback:** If Groq rate-limited → Gemini → keyword matching

#### Payments: Paystack + Stripe + PayPal
- **Paystack:** Africa (M-Pesa, cards, bank transfer)
- **Stripe:** Global (cards, Apple Pay, Google Pay)
- **PayPal:** Everywhere (backup option)
- **Two layers:** SaaS subscription (us) + Store payments (them)

#### Cache: Upstash Redis
- **Why:** Free tier, serverless, edge-deployed
- **Used for:** Product catalog cache, rate limiting, 
  cart storage, session data

#### Email: Resend
- **Why:** 100 emails/day free, good deliverability, simple API
- **Used for:** Welcome emails, order confirmations, 
  admin alerts, launch notifications

#### Hosting: Vercel
- **Why:** Free, auto-deploy from GitHub, serverless, 
  global CDN, cron jobs
- **Domains:** Main app + wildcard subdomains for stores

### 3. Multi-Tenant Architecture
EVERY store owner = 1 Organization in Clerk + 1 row in organizations table

ISOLATION:
1. Clerk middleware extracts org_id from session
2. Every DB query includes WHERE org_id = ?
3. API routes verify user belongs to org
4. Store owner A can NEVER see Store owner B's data

EXAMPLE:
GET /api/products
→ Clerk: who is this user? → user_123
→ Turso: what org? → org_456
→ Turso: SELECT * FROM products WHERE org_id = 'org_456'
→ Only returns org_456's products
→ org_789's products are invisible

### 4. WhatsApp Message Flow
INBOUND (Customer → Store):
1. Customer sends WhatsApp message
2. Meta Cloud API receives it
3. Meta sends POST webhook to /api/webhook
4. Verify webhook signature
5. Extract: phone_number_id, from, message
6. Find org by phone_number_id in Turso
7. Upsert contact in Turso
8. Save message in Turso
9. Process through store engine / chatbot
10. Generate response
11. Call Meta API to send reply
12. Save outbound message in Turso

OUTBOUND (Store → Customer):
1. Store owner types reply in inbox
2. POST /api/messages/send
3. Clerk: verify user + org
4. Call Meta API with org's access token
5. Save message in Turso
6. Return success to dashboard
7. Meta delivers to customer's WhatsApp
8. Status webhook: sent → delivered → read
9. Update message status in Turso

### 5. Payment Flow
STORE SALE (Customer pays Store Owner):
1. Customer clicks "Pay Now" in WhatsApp
2. API creates payment session using STORE OWNER's keys
3. Payment link sent to customer in WhatsApp
4. Customer pays (M-Pesa / Card / PayPal)
5. Payment provider webhook → /api/payments/store-webhook
6. Verify signature
7. Find order by reference
8. Update order.payment_status = 'paid'
9. Send WhatsApp confirmation to customer
10. Send WhatsApp notification to store owner
11. Money lands in STORE OWNER's account

SAAS SUBSCRIPTION (Store Owner pays Us):
1. Store owner clicks "Subscribe"
2. Detect country → show Paystack or Stripe or PayPal
3. Redirect to payment checkout
4. Customer pays
5. Webhook → /api/payments/subscribe-webhook
6. Verify signature
7. Update org.plan = 'starter'
8. Update org.subscription_id
9. Send welcome email
10. Money lands in OUR account

### 6. Environment Variables
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Turso
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=eyJ...

# WhatsApp (Meta)
WHATSAPP_VERIFY_TOKEN=your-random-verify-token
WHATSAPP_APP_SECRET=your-meta-app-secret

# AI
GROQ_API_KEY=gsk_...
GOOGLE_GEMINI_API_KEY=AI...

# Payments (YOUR accounts)
PAYSTACK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AX...

# Email
RESEND_API_KEY=re_...

# Security
ENCRYPTION_KEY=32-char-random-string
ADMIN_USER_ID=your-clerk-user-id

# App
NEXT_PUBLIC_APP_URL=https://yoursaas.com
NEXT_PUBLIC_APP_NAME=SELLA

# MASTER PROMPT — Give This To Claude In Your IDE

Copy everything below this line and paste into Claude (Arena/Cursor).

---

## PROMPT START

You are building a SaaS application called CHATEVO — a WhatsApp Commerce Platform.

### WHAT IT IS
A tool that lets businesses sell products directly inside WhatsApp. Customers browse, buy, and pay without leaving the chat. The business owner manages everything from a web dashboard.

### TECH STACK (DO NOT CHANGE THESE)
- **Framework:** Next.js 14 with App Router, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Turso (libSQL/SQLite) with Drizzle ORM
- **Auth:** Clerk (@clerk/nextjs)
- **AI:** Groq SDK (Llama 3.1) + Google Gemini (backup)
- **Payments:** Paystack + Stripe + PayPal
- **Cache:** Upstash Redis (@upstash/redis)
- **Email:** Resend
- **Hosting:** Vercel (serverless)
- **WhatsApp:** Meta Cloud API (Graph API v21.0)

### WHAT TO CREATE

Create the complete Next.js project skeleton with all files, folders, routes, components, database schema, API routes, and configuration. The project should be ready to develop features into.

### PROJECT STRUCTURE — CREATE EXACTLY THIS
app/
├── (marketing)/ # Public pages (no auth)
│ ├── page.tsx # Landing/home page
│ ├── pricing/
│ │ └── page.tsx # Pricing page
│ └── layout.tsx # Marketing layout (navbar + footer)
│
├── (auth)/ # Auth pages (Clerk)
│ ├── sign-in/[[...sign-in]]/
│ │ └── page.tsx
│ ├── sign-up/[[...sign-up]]/
│ │ └── page.tsx
│ └── layout.tsx # Centered auth layout
│
├── onboarding/ # Post-signup setup
│ └── page.tsx # Business name, country, currency wizard
│
├── dashboard/ # Protected dashboard (requires auth)
│ ├── layout.tsx # Sidebar + topbar layout
│ ├── page.tsx # Dashboard home (stats overview)
│ ├── products/
│ │ ├── page.tsx # Product list
│ │ ├── new/
│ │ │ └── page.tsx # Add product form
│ │ └── [id]/
│ │ └── page.tsx # Edit product
│ ├── orders/
│ │ ├── page.tsx # Orders list
│ │ └── [id]/
│ │ └── page.tsx # Order detail
│ ├── inbox/
│ │ └── page.tsx # Shared inbox (conversations + chat)
│ ├── contacts/
│ │ ├── page.tsx # Contact list
│ │ └── [id]/
│ │ └── page.tsx # Contact detail
│ ├── auto-replies/
│ │ └── page.tsx # Manage auto-replies
│ ├── settings/
│ │ ├── page.tsx # General settings
│ │ ├── whatsapp/
│ │ │ └── page.tsx # Connect WhatsApp
│ │ ├── payments/
│ │ │ └── page.tsx # Payment setup
│ │ ├── store/
│ │ │ └── page.tsx # Mini website settings
│ │ └── billing/
│ │ └── page.tsx # Subscription management
│ └── loading.tsx # Dashboard loading skeleton
│
├── admin/ # Platform admin (owner only)
│ ├── layout.tsx # Admin layout (different from dashboard)
│ ├── page.tsx # Admin overview
│ ├── users/
│ │ └── page.tsx # All users management
│ ├── revenue/
│ │ └── page.tsx # Revenue tracking
│ ├── waitlist/
│ │ └── page.tsx # Waitlist management
│ └── system/
│ └── page.tsx # System health
│
├── store/ # Public mini-websites
│ └── [slug]/
│ ├── page.tsx # Store homepage
│ ├── [category]/
│ │ └── page.tsx # Category page
│ └── product/
│ └── [id]/
│ └── page.tsx # Product detail page
│
├── api/ # API Routes
│ ├── webhook/
│ │ └── route.ts # WhatsApp webhook (GET verify + POST messages)
│ ├── products/
│ │ ├── route.ts # GET (list) + POST (create)
│ │ └── [id]/
│ │ └── route.ts # GET + PUT + DELETE
│ ├── orders/
│ │ ├── route.ts # GET (list) + POST (create)
│ │ └── [id]/
│ │ ├── route.ts # GET + PUT
│ │ └── status/
│ │ └── route.ts # PUT (update status → notify customer)
│ ├── contacts/
│ │ ├── route.ts # GET (list)
│ │ └── [id]/
│ │ └── route.ts # GET + PUT
│ ├── messages/
│ │ ├── route.ts # GET (by conversation)
│ │ └── send/
│ │ └── route.ts # POST (send message from inbox)
│ ├── conversations/
│ │ └── route.ts # GET (list conversations)
│ ├── auto-replies/
│ │ └── route.ts # GET + POST + PUT + DELETE
│ ├── payments/
│ │ ├── subscribe/
│ │ │ └── route.ts # POST (create subscription checkout)
│ │ ├── subscribe-webhook/
│ │ │ └── route.ts # POST (Paystack/Stripe subscription webhook)
│ │ ├── store-checkout/
│ │ │ └── route.ts # POST (create payment link for store sale)
│ │ └── store-webhook/
│ │ └── route.ts # POST (store payment confirmation webhook)
│ ├── store/
│ │ └── [slug]/
│ │ ├── route.ts # GET store info + products (public)
│ │ └── products/
│ │ └── route.ts # GET store products (public)
│ ├── admin/
│ │ ├── users/
│ │ │ └── route.ts # GET all users + PUT update
│ │ ├── stats/
│ │ │ └── route.ts # GET platform stats
│ │ ├── waitlist/
│ │ │ ├── route.ts # GET + POST (bulk import)
│ │ │ └── migrate/
│ │ │ └── route.ts # POST (migrate to real users)
│ │ └── notify/
│ │ └── route.ts # POST (send bulk notifications)
│ ├── onboarding/
│ │ └── route.ts # POST (create org after signup)
│ ├── upload/
│ │ └── route.ts # POST (image upload)
│ └── cron/
│ ├── trial-check/
│ │ └── route.ts # Check expired trials
│ └── reminders/
│ └── route.ts # Send abandoned cart reminders
│
├── layout.tsx # Root layout
├── globals.css # Global styles
├── not-found.tsx # 404 page
└── error.tsx # Error boundary

lib/ # Shared libraries
├── db/
│ ├── index.ts # Turso client connection
│ ├── schema.ts # Drizzle schema (all tables)
│ └── migrate.ts # Migration script
├── whatsapp/
│ ├── client.ts # Meta API client (send messages)
│ ├── webhook.ts # Webhook handler + verification
│ └── store-engine.ts # In-chat store logic (browse → buy)
├── payments/
│ ├── paystack.ts # Paystack API client
│ ├── stripe.ts # Stripe API client
│ └── paypal.ts # PayPal API client
├── ai/
│ ├── groq.ts # Groq client
│ ├── gemini.ts # Gemini client
│ └── index.ts # AI router (try Groq → fallback Gemini)
├── redis.ts # Upstash Redis client
├── email.ts # Resend email client
├── encryption.ts # Encrypt/decrypt tokens
├── utils.ts # Helper functions
├── constants.ts # App constants
└── types.ts # TypeScript types/interfaces

components/ # React components
├── ui/ # shadcn/ui components (auto-generated)
│ ├── button.tsx
│ ├── card.tsx
│ ├── input.tsx
│ ├── table.tsx
│ ├── dialog.tsx
│ ├── dropdown-menu.tsx
│ ├── badge.tsx
│ ├── tabs.tsx
│ ├── textarea.tsx
│ ├── select.tsx
│ ├── label.tsx
│ ├── skeleton.tsx
│ ├── toast.tsx
│ ├── avatar.tsx
│ └── separator.tsx
├── layout/
│ ├── sidebar.tsx # Dashboard sidebar
│ ├── topbar.tsx # Dashboard topbar
│ ├── mobile-nav.tsx # Mobile navigation
│ └── marketing-nav.tsx # Public page navbar
├── dashboard/
│ ├── stats-cards.tsx # Revenue/orders stat cards
│ ├── recent-orders.tsx # Recent orders widget
│ └── top-products.tsx # Top products widget
├── products/
│ ├── product-form.tsx # Add/edit product form
│ ├── product-table.tsx # Product list table
│ └── product-card.tsx # Product card (for store)
├── orders/
│ ├── order-table.tsx # Orders list table
│ ├── order-detail.tsx # Order detail view
│ └── status-badge.tsx # Order status badge
├── inbox/
│ ├── conversation-list.tsx # Left panel: conversations
│ ├── chat-view.tsx # Right panel: messages
│ ├── message-bubble.tsx # Single message bubble
│ ├── chat-input.tsx # Message input + send
│ └── contact-sidebar.tsx # Customer info sidebar
├── contacts/
│ ├── contact-table.tsx # Contact list table
│ └── contact-detail.tsx # Contact detail view
├── settings/
│ ├── whatsapp-connect.tsx # WhatsApp connection form
│ ├── payment-setup.tsx # Payment provider setup
│ └── store-settings.tsx # Mini website settings
├── store/
│ ├── store-header.tsx # Store page header
│ ├── product-grid.tsx # Product grid for store
│ └── product-page.tsx # Product detail for store
├── admin/
│ ├── admin-sidebar.tsx # Admin navigation
│ ├── user-table.tsx # All users table
│ └── platform-stats.tsx # Platform statistics
├── onboarding/
│ └── setup-wizard.tsx # Multi-step setup form
└── shared/
├── loading-spinner.tsx
├── empty-state.tsx
├── page-header.tsx
├── data-table.tsx # Reusable data table
├── search-input.tsx
└── confirm-dialog.tsx

middleware.ts # Clerk auth + admin protection

Configuration files:
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── drizzle.config.ts
├── components.json # shadcn config
├── .env.local # Environment variables (template)
├── .env.example # Example env file
└── .gitignore

### KEY IMPLEMENTATION DETAILS

#### 1. middleware.ts
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/api/payments/store-webhook(.*)',
  '/api/payments/subscribe-webhook(.*)',
  '/api/store(.*)',
  '/store(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

#### 2. lib/db/index.ts
```typescript
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

export const db = drizzle(client, { schema })
```

#### 3. lib/whatsapp/client.ts
- Must handle: sendTextMessage, sendImageMessage, sendButtonMessage, sendListMessage, sendTemplateMessage
- Use org's encrypted access token (decrypt before use)
- Base URL: https://graph.facebook.com/v21.0/{phoneNumberId}/messages

#### 4. lib/whatsapp/store-engine.ts
- Handle the full shopping flow: welcome → categories → products → product detail → cart → payment
- Use WhatsApp interactive messages (buttons, lists)
- Cart stored in Turso (carts table)
- Generate payment link on checkout

#### 5. Admin routes must check:
```typescript
const { userId } = auth()
if (userId !== process.env.ADMIN_USER_ID) {
  return new Response('Forbidden', { status: 403 })
}
```

#### 6. Multi-tenant: Every API route must:
```typescript
const { userId, orgId } = auth()
// All DB queries: WHERE org_id = orgId
```

### WHAT TO IMPLEMENT IN EACH FILE
For each file, create:
- Proper TypeScript types
- Real implementation (not just TODO comments)
- Error handling (try/catch, proper HTTP status codes)
- Loading states for pages
- Empty states ("No products yet. Add your first!")
- Mobile responsive design using Tailwind
- Form validation using Zod
- Proper Clerk auth checks

### PACKAGES TO INSTALL
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@clerk/nextjs": "^5.0.0",
    "@libsql/client": "^0.6.0",
    "drizzle-orm": "^0.30.0",
    "@upstash/redis": "^1.28.0",
    "groq-sdk": "^0.5.0",
    "@google/generative-ai": "^0.12.0",
    "resend": "^3.2.0",
    "axios": "^1.7.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "lucide-react": "^0.378.0",
    "date-fns": "^3.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "sonner": "^1.4.0",
    "next-themes": "^0.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "drizzle-kit": "^0.21.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

### DESIGN SYSTEM
- Primary color: #25D366 (WhatsApp green)
- Dark sidebar with green accents
- White content area
- Clean, minimal design
- Mobile-first approach
- Use shadcn/ui components everywhere
- Toast notifications for actions (sonner)
- Consistent spacing (p-4, p-6 for cards)
- Table with search and filter on all list pages

### IMPORTANT RULES
- Every database query MUST filter by org_id (multi-tenant)
- Every API route MUST check Clerk auth (except public routes)
- Admin routes MUST check ADMIN_USER_ID
- WhatsApp access tokens MUST be encrypted before storing
- Payment keys MUST never be sent to the frontend
- All forms MUST validate with Zod
- All pages MUST have loading and error states
- All list pages MUST have empty states
- Mobile responsive is REQUIRED on every page
- Use server components where possible, client only when needed
- Create ALL files with real, working code. Not placeholder TODOs.
- Start with the foundation files first (config, db, lib), then routes, then components, then pages.

PROMPT END

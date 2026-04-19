# Product Requirements Document (PRD)
## CHATEVO — WhatsApp Commerce Platform

---

### 1. Product Overview

**Product:** A SaaS platform that enables businesses to sell products
directly inside WhatsApp conversations.

**Vision:** Any business in the world can set up a WhatsApp store in
5 minutes and start receiving orders and payments through chat.

**Target Users:**
- Small business owners who sell via WhatsApp (primary)
- Instagram/Facebook sellers who take orders on WhatsApp
- Physical store owners who communicate with customers on WhatsApp
- Home-based businesses and solopreneurs
- Businesses in Africa, Asia, Latin America (primary markets)

**Market:**
- 200M+ businesses use WhatsApp globally
- Africa: fastest growing WhatsApp commerce market
- India: largest WhatsApp market by users
- Latin America: WhatsApp is primary business communication
- Current tools (Wati $99/mo, Interakt $55/mo) focus on messaging, not selling

---

### 2. User Personas

#### Persona 1: Amina (Small Fashion Seller — Kenya)
- Sells clothes on Instagram, takes orders via WhatsApp
- Gets 50-100 "how much?" messages daily
- Manages orders in a notebook
- Accepts M-Pesa payments manually
- No website, no Shopify
- Budget: KES 2,000-4,000/month ($15-30)
- Pain: Spends 4+ hours daily replying to same questions

#### Persona 2: Chidi (Electronics Shop — Nigeria)
- Has a physical shop + sells on WhatsApp
- 200+ customers contact him daily
- Sends product photos one by one
- Tracks orders in Excel
- Has tried Interakt but found it expensive and limited
- Budget: ₦15,000-30,000/month ($20-40)
- Pain: Loses sales because he can't reply fast enough

#### Persona 3: Sarah (Handmade Crafts — US/UK)
- Sells handmade jewelry on Etsy + Instagram
- Uses WhatsApp for international customers
- Wants a simple storefront without building a website
- Currently uses Shopify ($39/mo) but wants WhatsApp integration
- Budget: $30-60/month
- Pain: Can't connect WhatsApp to her store properly

---

### 3. Feature Specification — Starter Plan ($29/month)

This is the ONLY plan we build for MVP.

#### 3.1 WhatsApp Store (In-Chat Shopping)

**User Story:** As a customer, I want to browse and buy products 
inside WhatsApp so I don't have to visit a website.

**Flow:**
Customer: "Hi"
Bot: "Welcome to [Store]! 👋
[🛍️ Shop] [📦 Track Order] [💬 Talk to Human]"
Customer: clicks [🛍️ Shop]
Bot: "Choose a category:
[👕 Clothing] [👟 Shoes] [🎒 Accessories]"
Customer: clicks [👕 Clothing]
Bot: "👕 Clothing:
1. Blue T-Shirt — KES 1,500
2. Red Dress — KES 3,000
3. Black Jeans — KES 2,500
Reply with number for details"
Customer: "1"
Bot: "[Image of Blue T-Shirt]
Blue T-Shirt — KES 1,500
Sizes available: S, M, L, XL
[S] [M] [L] [XL]"
Customer: clicks [L]
Bot: "Added to cart! 🛒
Blue T-Shirt (L) — KES 1,500
[💳 Pay Now] [🛒 Add More] [🗑️ Clear Cart]"
Customer: clicks [💳 Pay Now]
Bot: "Choose payment method:
[📱 M-Pesa] [💳 Card] [🚚 Cash on Delivery]"
Customer: clicks [📱 M-Pesa]
Bot: "Pay KES 1,500:
👉 https://paystack.com/pay/order-123
Link expires in 30 minutes ⏰"
[Customer pays]
Bot: "✅ Payment received!
Order #ORD-2024-0001
Blue T-Shirt (L) — KES 1,500
We'll notify you when it ships! 📦"

**Acceptance Criteria:**
- [ ] Bot responds within 3 seconds
- [ ] Products displayed with images
- [ ] Cart persists for 24 hours
- [ ] Supports up to 200 products
- [ ] Supports up to 10 categories
- [ ] Variant selection (size, color) works
- [ ] Payment link generated correctly
- [ ] Order created automatically on payment
- [ ] Confirmation sent to customer AND store owner

#### 3.2 Product Management

**User Story:** As a store owner, I want to add and manage my 
products so they appear in my WhatsApp store.

**Features:**
- Add product: name, description, price, images, category, variants
- Edit product
- Delete product
- Toggle active/inactive
- Set inventory count
- View all products (table with search/filter)
- Up to 200 products
- Up to 10 categories

**Acceptance Criteria:**
- [ ] Product form validates all required fields
- [ ] Images upload successfully (max 5MB each)
- [ ] Products appear in WhatsApp store within 1 minute
- [ ] Out-of-stock products show "Out of Stock" in chat
- [ ] Categories auto-populate from products

#### 3.3 Order Management

**User Story:** As a store owner, I want to see all orders and 
update their status so I can fulfill them efficiently.

**Features:**
- View all orders (table)
- Filter by status: New / Confirmed / Shipped / Delivered / Cancelled
- Order detail: items, customer info, payment status, delivery info
- Update status (Confirm → Ship → Deliver)
- Add tracking number
- Auto-notify customer on status change via WhatsApp
- Up to 300 orders/month

**Acceptance Criteria:**
- [ ] Orders auto-created from WhatsApp purchases
- [ ] Status change triggers WhatsApp notification to customer
- [ ] Order number auto-generated (ORD-YYYY-NNNN)
- [ ] Payment status shown (paid/pending/COD)
- [ ] Can search by order number or customer name

#### 3.4 Payment Collection

**User Story:** As a store owner, I want to collect payments from 
customers directly in WhatsApp.

**Features:**
- Connect Paystack account (Africa)
- Connect Stripe account (Global)
- Connect PayPal account (Global)
- Enable Cash on Delivery
- Enable Bank Transfer (manual)
- Payment link generated in WhatsApp chat
- Payment confirmation auto-detected via webhook
- Order auto-updated on payment

**Acceptance Criteria:**
- [ ] At least one payment method required during setup
- [ ] Payment link works on mobile (most customers are mobile)
- [ ] Payment webhook correctly updates order
- [ ] Customer receives payment confirmation in WhatsApp
- [ ] Store owner receives notification of payment
- [ ] Money goes directly to store owner's account (not ours)

#### 3.5 Shared Inbox

**User Story:** As a store owner, I want to see and reply to all 
customer conversations from my dashboard.

**Features:**
- View all conversations (list)
- Read full message history
- Reply to customers from dashboard
- See customer info (name, phone, orders, total spent)
- "Talk to Human" handoff (bot stops, human takes over)
- Mark conversations as resolved
- Unread count badges
- 1 agent (Starter plan)

**Acceptance Criteria:**
- [ ] New messages appear within 5 seconds
- [ ] Can send text, images from dashboard
- [ ] Message status shown (sent/delivered/read)
- [ ] Bot pauses when "Talk to Human" triggered
- [ ] Can re-enable bot on a conversation
- [ ] Customer info sidebar shows purchase history

#### 3.6 Contact Management

**User Story:** As a store owner, I want to see all my customers 
and their history.

**Features:**
- Auto-save contacts from conversations
- View all contacts (table with search)
- Contact detail: name, phone, orders, total spent, tags
- Add tags (VIP, new, wholesale)
- Export contacts (CSV)
- Up to 1,000 contacts

**Acceptance Criteria:**
- [ ] Contacts auto-created on first message
- [ ] Name pulled from WhatsApp profile
- [ ] Purchase history shown on contact page
- [ ] Tags can be added/removed
- [ ] CSV export works correctly

#### 3.7 Auto-Generated Mini Website

**User Story:** As a store owner, I want a simple website for my 
business without building one myself.

**Features:**
- Auto-generated at [slug].chatevo.io
- Homepage: store name, logo, featured products
- Category pages
- Product detail pages
- "Buy on WhatsApp" button on every product
- Mobile responsive
- Store owner can customize: logo, theme color, description
- "Powered by CHATEVO" footer

**Acceptance Criteria:**
- [ ] Website auto-generates when store owner adds first product
- [ ] Products sync from dashboard to website
- [ ] "Buy on WhatsApp" opens WhatsApp with pre-filled message
- [ ] Looks good on mobile
- [ ] Loads in under 3 seconds
- [ ] SEO-friendly (meta tags, titles)

#### 3.8 Basic Auto-Replies

**User Story:** As a store owner, I want common questions answered 
automatically so I don't have to reply manually.

**Features:**
- Customizable welcome message
- Business hours auto-reply
- 5 custom keyword → reply pairs
- Order status inquiry auto-reply
- Default "I don't understand" reply with menu
- FAQ bot (up to 10 Q&A pairs)

**Acceptance Criteria:**
- [ ] Welcome message sends within 2 seconds of "Hi"
- [ ] Business hours message sends outside set hours
- [ ] Keywords are case-insensitive
- [ ] Order status lookup works when customer provides order number
- [ ] Default reply always offers helpful menu options

#### 3.9 Dashboard Home

**User Story:** As a store owner, I want to see my key business 
numbers at a glance.

**Features:**
- Orders today / this week / this month / all time
- Revenue today / this week / this month / all time
- New contacts today
- Messages today
- Top 5 products (by order count)
- Recent orders (last 5)

**Acceptance Criteria:**
- [ ] Numbers are accurate
- [ ] Page loads in under 2 seconds
- [ ] Currency displayed correctly per store
- [ ] Looks clean and not cluttered

#### 3.10 SaaS Subscription (How We Get Paid)

**User Story:** As a store owner, I want to subscribe and pay 
for the tool monthly.

**Features:**
- 14-day free trial on signup
- Starter plan: $29/month
- Payment methods: Paystack (Africa), Stripe (Global), PayPal
- Auto-detect country → show relevant payment option first
- Auto-renew monthly
- Cancel anytime
- Free plan limits after trial:
  - 10 products
  - 20 orders/month
  - 50 contacts
  - "Powered by" watermark (can't remove)
- Upgrade prompt when hitting limits

**Acceptance Criteria:**
- [ ] Trial starts automatically on signup (14 days)
- [ ] Trial countdown shown in dashboard
- [ ] Subscription creates successfully via Paystack/Stripe/PayPal
- [ ] Webhook correctly updates user plan on payment
- [ ] Features limited correctly on free plan
- [ ] Friendly upgrade prompts (not annoying)

#### 3.11 Admin Panel (Owner's Eyes Only)

**User Story:** As the platform owner, I want to manage all users,
see revenue, and control the system.

**Features:**
- Protected by Clerk (only specific user ID)
- Dashboard: total users, MRR, signups, revenue
- User management: view, search, filter, edit plan, ban
- Bulk add users (CSV upload for waitlist migration)
- Send email/WhatsApp to users or segments
- Waitlist management (import, migrate, notify)
- System health (API status, errors, DB usage)
- Feature flags (enable/disable features)

**Acceptance Criteria:**
- [ ] Only platform owner can access (403 for everyone else)
- [ ] MRR calculation is accurate
- [ ] Can bulk import users from CSV
- [ ] Can change any user's plan
- [ ] Can send bulk notifications

---

### 4. Non-Functional Requirements

**Performance:**
- Dashboard pages load in < 2 seconds
- WhatsApp bot responds in < 3 seconds
- Payment links generate in < 2 seconds
- Support 100+ concurrent store owners

**Security:**
- WhatsApp access tokens encrypted at rest
- Payment API keys never exposed to frontend
- Multi-tenant isolation (org_id on every query)
- Rate limiting on all API endpoints
- Input validation on all forms
- HTTPS everywhere

**Scalability:**
- Turso edge DB handles global traffic
- Vercel serverless auto-scales
- Redis caching reduces DB load
- Designed for 1,000+ stores without architecture change

**Reliability:**
- Webhook retries (Meta retries failed webhooks)
- Payment webhook verification (prevent fraud)
- Error logging and alerting
- Graceful degradation (if AI is down, use keyword matching)

---

### 5. What We Are NOT Building (MVP Exclusions)

- Drag-and-drop chatbot builder
- Bulk messaging / campaigns
- AI shopping assistant
- Advanced analytics / charts
- Multi-agent support (>1 agent)
- Shopify/WooCommerce integration
- Loyalty program
- Referral system
- A/B testing
- Drip campaigns
- Custom domains for stores
- Real-time WebSocket inbox
- Mobile app
- Multi-language AI translation

These are Growth ($59) and Premium ($99) features.
Built only after Starter has paying customers.

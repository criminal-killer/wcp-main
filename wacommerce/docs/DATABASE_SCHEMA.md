# Database Schema
## CHATEVO — Turso (SQLite)

---

### Full Schema (Drizzle ORM Format)

```sql
-- ============================================
-- ORGANIZATIONS (Multi-tenant core)
-- ============================================
CREATE TABLE organizations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- WhatsApp Connection
    wa_phone_number_id TEXT,
    wa_business_account_id TEXT,
    wa_access_token_encrypted TEXT,
    wa_webhook_verified INTEGER DEFAULT 0,
    
    -- Business Info
    country TEXT DEFAULT 'KE',
    currency TEXT DEFAULT 'KES',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Africa/Nairobi',
    business_type TEXT,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#25D366',
    description TEXT,
    
    -- Business Hours (JSON)
    business_hours TEXT DEFAULT '{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"09:00","close":"14:00"},"sun":null}',
    
    -- Subscription
    plan TEXT DEFAULT 'trial' CHECK(plan IN ('trial','free','starter','growth','premium')),
    trial_ends_at TEXT,
    subscription_id TEXT,
    payment_provider TEXT CHECK(payment_provider IN ('paystack','stripe','paypal')),
    
    -- Store Payment Setup (how THEIR customers pay THEM)
    store_paystack_key_encrypted TEXT,
    store_stripe_account_id TEXT,
    store_paypal_email TEXT,
    store_mpesa_till TEXT,
    store_cod_enabled INTEGER DEFAULT 1,
    store_bank_details TEXT,
    
    -- Delivery
    delivery_fee REAL DEFAULT 0,
    free_delivery_above REAL,
    delivery_zones TEXT, -- JSON
    
    -- Referral
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    
    -- Meta
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

-- ============================================
-- USERS (Linked to Clerk)
-- ============================================
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    clerk_id TEXT UNIQUE NOT NULL,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'owner' CHECK(role IN ('owner','admin','agent')),
    created_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    compare_at_price REAL,
    currency TEXT DEFAULT 'KES',
    category TEXT DEFAULT 'General',
    images TEXT DEFAULT '[]', -- JSON array of URLs
    variants TEXT DEFAULT '[]', -- JSON: [{"type":"size","options":["S","M","L"]}]
    inventory_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_org ON products(org_id);
CREATE INDEX idx_products_category ON products(org_id, category);

-- ============================================
-- CONTACTS (End customers)
-- ============================================
CREATE TABLE contacts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    phone TEXT NOT NULL,
    name TEXT,
    email TEXT,
    language TEXT DEFAULT 'en',
    tags TEXT DEFAULT '[]', -- JSON array
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    last_order_at TEXT,
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(org_id, phone)
);

CREATE INDEX idx_contacts_org ON contacts(org_id);
CREATE INDEX idx_contacts_phone ON contacts(org_id, phone);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    assigned_to TEXT REFERENCES users(id),
    status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','pending','bot')),
    is_bot_active INTEGER DEFAULT 1,
    last_message_at TEXT,
    last_message_preview TEXT,
    unread_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_conversations_org ON conversations(org_id);
CREATE INDEX idx_conversations_status ON organizations(org_id, status);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','image','video','document','audio','template','interactive','location','reaction')),
    wa_message_id TEXT,
    status TEXT DEFAULT 'sent' CHECK(status IN ('sent','delivered','read','failed','received')),
    sent_by TEXT REFERENCES users(id), -- NULL if bot, user_id if human
    metadata TEXT, -- JSON: extra data
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_org ON messages(org_id);
CREATE INDEX idx_messages_wa_id ON messages(wa_message_id);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    order_number TEXT NOT NULL,
    
    -- Items
    items TEXT NOT NULL, -- JSON: [{"product_id":"...","name":"...","price":1500,"quantity":1,"variant":"L"}]
    
    -- Pricing
    subtotal REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    currency TEXT DEFAULT 'KES',
    
    -- Payment
    payment_method TEXT CHECK(payment_method IN ('mpesa','card','paypal','cod','bank_transfer')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','refunded')),
    payment_reference TEXT,
    payment_provider TEXT,
    
    -- Delivery
    delivery_address TEXT,
    tracking_number TEXT,
    
    -- Status
    order_status TEXT DEFAULT 'new' CHECK(order_status IN ('new','confirmed','processing','shipped','delivered','cancelled','returned')),
    
    -- Notes
    notes TEXT,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_orders_org ON orders(org_id);
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(org_id, order_status);

-- ============================================
-- CARTS (Temporary, per conversation)
-- ============================================
CREATE TABLE carts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    items TEXT DEFAULT '[]', -- JSON
    total REAL DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(org_id, contact_id)
);

-- ============================================
-- AUTO REPLIES
-- ============================================
CREATE TABLE auto_replies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    type TEXT NOT NULL CHECK(type IN ('welcome','business_hours','keyword','default','order_status','faq')),
    keyword TEXT, -- for keyword type
    question TEXT, -- for FAQ type
    response TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_auto_replies_org ON auto_replies(org_id);

-- ============================================
-- TEMPLATES (WhatsApp Message Templates)
-- ============================================
CREATE TABLE templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    header_type TEXT CHECK(header_type IN ('text','image','video','document')),
    header_content TEXT,
    footer TEXT,
    buttons TEXT, -- JSON
    variables TEXT, -- JSON
    meta_template_id TEXT,
    meta_status TEXT DEFAULT 'draft' CHECK(meta_status IN ('draft','pending','approved','rejected')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- PAYMENTS LOG
-- ============================================
CREATE TABLE payments_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id),
    order_id TEXT REFERENCES orders(id),
    type TEXT NOT NULL CHECK(type IN ('store_sale','subscription')),
    provider TEXT NOT NULL CHECK(provider IN ('paystack','stripe','paypal','mpesa')),
    provider_reference TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','success','failed','refunded')),
    metadata TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- REFERRALS (SaaS referral program)
-- ============================================
CREATE TABLE referrals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    referrer_org_id TEXT NOT NULL REFERENCES organizations(id),
    referred_org_id TEXT REFERENCES organizations(id),
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'clicked' CHECK(status IN ('clicked','signed_up','subscribed','rewarded')),
    reward_type TEXT,
    reward_amount REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- WAITLIST (Pre-launch)
-- ============================================
CREATE TABLE waitlist (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    country TEXT,
    business_type TEXT,
    current_selling TEXT, -- JSON array
    monthly_orders TEXT,
    problems TEXT, -- JSON array of selected problems
    custom_problem TEXT,
    pricing_willingness TEXT,
    currently_paying TEXT,
    current_tool TEXT,
    current_tool_complaint TEXT,
    would_pay TEXT,
    wants_beta INTEGER DEFAULT 0,
    device TEXT,
    product_count TEXT,
    can_whatsapp_feedback INTEGER DEFAULT 0,
    referral_code TEXT,
    referred_by TEXT,
    heard_from TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    ip_address TEXT,
    migrated INTEGER DEFAULT 0,
    migrated_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- ORDER NUMBER SEQUENCE
-- ============================================
CREATE TABLE sequences (
    org_id TEXT PRIMARY KEY REFERENCES organizations(id),
    last_order_number INTEGER DEFAULT 0
);
```

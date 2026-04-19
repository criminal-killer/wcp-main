import { sql, relations } from 'drizzle-orm'
import { text, integer, real, sqliteTable, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

// ============================================
// ORGANIZATIONS (Multi-tenant core)
// ============================================
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // WhatsApp Connection
  wa_phone_number_id: text('wa_phone_number_id'),
  wa_business_account_id: text('wa_business_account_id'),
  wa_access_token_encrypted: text('wa_access_token_encrypted'),
  wa_webhook_verified: integer('wa_webhook_verified').default(0),

  // Business Info
  country: text('country').default('KE'),
  currency: text('currency').default('KES'),
  language: text('language').default('en'),
  timezone: text('timezone').default('Africa/Nairobi'),
  business_type: text('business_type'),
  logo_url: text('logo_url'),
  theme_color: text('theme_color').default('#25D366'),
  description: text('description'),
  business_hours: text('business_hours').default('{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"09:00","close":"14:00"},"sun":null}'),

  // Subscription
  plan: text('plan').default('trial'),
  trial_ends_at: text('trial_ends_at'),
  subscription_id: text('subscription_id'),
  payment_provider: text('payment_provider'),

  // Store Payment Setup
  store_paystack_key_encrypted: text('store_paystack_key_encrypted'),
  store_stripe_account_id: text('store_stripe_account_id'),
  store_paypal_email: text('store_paypal_email'),
  store_mpesa_till: text('store_mpesa_till'),
  store_cod_enabled: integer('store_cod_enabled').default(1),
  store_bank_details: text('store_bank_details'),

  // Delivery
  delivery_fee: real('delivery_fee').default(0),
  free_delivery_above: real('free_delivery_above'),
  delivery_zones: text('delivery_zones'),

  // Referral
  referral_code: text('referral_code').unique(),
  referred_by: text('referred_by'),

  // Managed Payments (MoR)
  payment_mode: text('payment_mode').default('direct'), // direct, managed
  managed_balance: real('managed_balance').default(0),
  managed_currency: text('managed_currency').default('KES'),
  managed_payout_details: text('managed_payout_details'),
  managed_payout_interval: text('managed_payout_interval').default('weekly'),

  // AI Configuration
  ai_provider: text('ai_provider').default('chatevo'), // chatevo (groq), openai, anthropic, google, custom
  ai_api_key_encrypted: text('ai_api_key_encrypted'),
  ai_model: text('ai_model'),
  ai_persona: text('ai_persona').default('educator'), // educator, sales, support
  ai_endpoint_url: text('ai_endpoint_url'), // for custom openai-compatible endpoints
  ai_system_prompt: text('ai_system_prompt'), // custom refinement

  // Bot Customization (Growth/Elite Features)
  bot_menu_style: text('bot_menu_style').default('professional'), // professional, street, minimal, corporate, friendly
  bot_emojis_enabled: integer('bot_emojis_enabled').default(1),
  bot_custom_footer: text('bot_custom_footer').default('Powered by Chatevo'),
  bot_show_search: integer('bot_show_search').default(1),
  bot_show_categories: integer('bot_show_categories').default(1),
  bot_show_cart: integer('bot_show_cart').default(1),
  bot_show_orders: integer('bot_show_orders').default(1),

  // AI Usage Tracking (Starter limits: 20/day, 350/month)
  usage_ai_daily_count: integer('usage_ai_daily_count').default(0),
  usage_ai_monthly_count: integer('usage_ai_monthly_count').default(0),
  usage_last_reset_daily: text('usage_last_reset_daily').default(sql`(datetime('now'))`),
  usage_last_reset_monthly: text('usage_last_reset_monthly').default(sql`(datetime('now'))`),

  // Meta
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  is_active: integer('is_active').default(1),
  is_waitlisted: integer('is_waitlisted').default(0),
  enabled_features: text('enabled_features').default('{"ai_shopping":true,"manual_payments":true,"delivery_zones":true}'),
}, (table) => ({
  // Index for webhook org lookup — hit on EVERY incoming WhatsApp message
  waPhoneIdx: index('org_wa_phone_idx').on(table.wa_phone_number_id),
  // Index for slug-based store page lookups
  slugIdx: uniqueIndex('org_slug_idx').on(table.slug),
}))

export const payouts = sqliteTable('payouts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  amount: real('amount').notNull(),
  currency: text('currency').default('KES'),
  status: text('status').default('pending'), // pending, scheduled, completed, failed
  method: text('method'), // mpesa, bank
  reference: text('reference'), // paystack transfer code
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// USERS (Linked to Clerk)
// ============================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  clerk_id: text('clerk_id').notNull().unique(),
  org_id: text('org_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('owner'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  is_active: integer('is_active').default(1),
  is_super_admin: integer('is_super_admin').default(0),
})

// ============================================
// PRODUCTS
// ============================================
export const products = sqliteTable('products', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  compare_at_price: real('compare_at_price'),
  currency: text('currency').default('KES'),
  category: text('category').default('General'),
  images: text('images').default('[]'),
  variants: text('variants').default('[]'),
  inventory_count: integer('inventory_count').default(0),
  color: text('color'), // for filtering
  metadata: text('metadata').default('{}'), // extra searchable attributes (JSON)
  is_active: integer('is_active').default(1),
  type: text('type').default('physical'), // physical, digital, service
  digital_content: text('digital_content'), // links/keys/files
  sort_order: integer('sort_order').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  // Index for product listing — hit on every Browse Shop action
  orgActiveIdx: index('products_org_active_idx').on(table.org_id, table.is_active),
  // Index for product category browsing
  orgCategoryIdx: index('products_org_category_idx').on(table.org_id, table.category),
}))
// ============================================
export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  phone: text('phone').notNull(),
  name: text('name'),
  email: text('email'),
  language: text('language').default('en'),
  tags: text('tags').default('[]'),
  total_orders: integer('total_orders').default(0),
  total_spent: real('total_spent').default(0),
  last_order_at: text('last_order_at'),
  notes: text('notes'),
  loyalty_points: integer('loyalty_points').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  // CRITICAL: hit on every single incoming WhatsApp message (contact upsert)
  orgPhoneIdx: uniqueIndex('contacts_org_phone_idx').on(table.org_id, table.phone),
  // Index for contacts list page sorted by recency
  orgCreatedIdx: index('contacts_org_created_idx').on(table.org_id, table.created_at),
}))
// ============================================
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  contact_id: text('contact_id').notNull().references(() => contacts.id),
  assigned_to: text('assigned_to').references(() => users.id),
  status: text('status').default('open'),
  is_bot_active: integer('is_bot_active').default(1),
  last_message_at: text('last_message_at'),
  last_message_preview: text('last_message_preview'),
  unread_count: integer('unread_count').default(0),
  temp_flow_state: text('temp_flow_state'), // Fallback for Redis
  created_at: text('created_at').default(sql`(datetime('now'))`),
}, (table) => ({
  // CRITICAL: hit on every message to find/create the conversation
  orgContactIdx: uniqueIndex('conv_org_contact_idx').on(table.org_id, table.contact_id),
  // Index for inbox list ordered by last message
  orgLastMsgIdx: index('conv_org_lastmsg_idx').on(table.org_id, table.last_message_at),
}))

// ============================================
// MESSAGES
// ============================================
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  conversation_id: text('conversation_id').notNull().references(() => conversations.id),
  contact_id: text('contact_id').notNull().references(() => contacts.id),
  direction: text('direction').notNull(),
  content: text('content'),
  message_type: text('message_type').default('text'),
  wa_message_id: text('wa_message_id'),
  status: text('status').default('sent'),
  sent_by: text('sent_by').references(() => users.id),
  metadata: text('metadata'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
}, (table) => ({
  // CRITICAL: inbox loads messages by conversation — most frequently read table
  convIdIdx: index('messages_conv_idx').on(table.conversation_id, table.created_at),
  // Index for org-level queries
  orgIdIdx: index('messages_org_idx').on(table.org_id, table.created_at),
}))
// ============================================
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  contact_id: text('contact_id').notNull().references(() => contacts.id),
  order_number: text('order_number').notNull(),
  items: text('items').notNull(),
  subtotal: real('subtotal').notNull(),
  delivery_fee: real('delivery_fee').default(0),
  discount: real('discount').default(0),
  total: real('total').notNull(),
  currency: text('currency').default('KES'),
  payment_method: text('payment_method'),
  payment_status: text('payment_status').default('pending'),
  payment_reference: text('payment_reference'),
  payment_provider: text('payment_provider'),
  delivery_address: text('delivery_address'),
  delivery_zone: text('delivery_zone'),
  payment_proof: text('payment_proof'),
  tracking_number: text('tracking_number'),
  order_status: text('order_status').default('new'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  // CRITICAL: dashboard runs 7 queries against orders — all filter by org_id
  orgIdIdx: index('orders_org_idx').on(table.org_id),
  // Index for date-based metrics (today/week/month revenue)
  orgDateIdx: index('orders_org_date_idx').on(table.org_id, table.created_at),
  // Index for payment status filter (paid revenue calculation)
  orgPaymentIdx: index('orders_org_payment_idx').on(table.org_id, table.payment_status),
  // Unique index for order numbers
  orderNumIdx: uniqueIndex('orders_number_idx').on(table.order_number),
}))

// ============================================
// CARTS (Temporary, per conversation)
// ============================================
export const carts = sqliteTable('carts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  contact_id: text('contact_id').notNull().references(() => contacts.id),
  items: text('items').default('[]'),
  total: real('total').default(0),
  currency: text('currency').default('KES'),
  expires_at: text('expires_at'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
})

// ============================================
// AUTO REPLIES
// ============================================
export const auto_replies = sqliteTable('auto_replies', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  type: text('type').notNull(),
  keyword: text('keyword'),
  question: text('question'),
  response: text('response').notNull(),
  is_active: integer('is_active').default(1),
  sort_order: integer('sort_order').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// TEMPLATES (WhatsApp Message Templates)
// ============================================
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  body: text('body').notNull(),
  header_type: text('header_type'),
  header_content: text('header_content'),
  footer: text('footer'),
  buttons: text('buttons'),
  variables: text('variables'),
  meta_template_id: text('meta_template_id'),
  meta_status: text('meta_status').default('draft'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// PAYMENTS LOG
// ============================================
export const payments_log = sqliteTable('payments_log', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  order_id: text('order_id').references(() => orders.id),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  provider_reference: text('provider_reference'),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status').default('pending'),
  metadata: text('metadata'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// REFERRALS
// ============================================
export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  referrer_org_id: text('referrer_org_id').notNull().references(() => organizations.id),
  referred_org_id: text('referred_org_id').references(() => organizations.id),
  referral_code: text('referral_code').notNull(),
  status: text('status').default('clicked'),
  reward_type: text('reward_type'),
  reward_amount: real('reward_amount'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// WAITLIST (Pre-launch)
// ============================================
export const waitlist = sqliteTable('waitlist', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  full_name: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  country: text('country'),
  business_type: text('business_type'),
  current_selling: text('current_selling'),
  monthly_orders: text('monthly_orders'),
  problems: text('problems'),
  custom_problem: text('custom_problem'),
  pricing_willingness: text('pricing_willingness'),
  currently_paying: text('currently_paying'),
  current_tool: text('current_tool'),
  current_tool_complaint: text('current_tool_complaint'),
  would_pay: text('would_pay'),
  wants_beta: integer('wants_beta').default(0),
  device: text('device'),
  product_count: text('product_count'),
  can_whatsapp_feedback: integer('can_whatsapp_feedback').default(0),
  referral_code: text('referral_code'),
  referred_by: text('referred_by'),
  heard_from: text('heard_from'),
  utm_source: text('utm_source'),
  utm_medium: text('utm_medium'),
  utm_campaign: text('utm_campaign'),
  ip_address: text('ip_address'),
  migrated: integer('migrated').default(0),
  migrated_at: text('migrated_at'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// SEQUENCES (Order number generation)
// ============================================
export const sequences = sqliteTable('sequences', {
  org_id: text('org_id').primaryKey().references(() => organizations.id),
  last_order_number: integer('last_order_number').default(0),
})

// ============================================
// SUBSCRIPTIONS (SaaS billing)
// ============================================
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id).unique(),
  plan: text('plan').notNull().default('starter'),
  status: text('status').notNull().default('active'), // active, cancelled, past_due
  provider: text('provider').notNull(), // paystack, stripe
  amount: real('amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  paystack_subscription_code: text('paystack_subscription_code'),
  stripe_subscription_id: text('stripe_subscription_id'),
  current_period_start: text('current_period_start'),
  current_period_end: text('current_period_end'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
})

// ============================================
// SUPPORT TICKETS / SETUP BOOKINGS
// ============================================
export const support_tickets = sqliteTable('support_tickets', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  user_id: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull().default('general'), // setup, billing, support
  status: text('status').default('open'), // open, in-progress, resolved
  subject: text('subject').notNull(),
  description: text('description'),
  metadata: text('metadata'), // JSONified object for extra details
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
})

// ============================================
// AFFILIATES (Public Referral Program)
// ============================================
export const affiliates = sqliteTable('affiliates', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  clerk_id: text('clerk_id').unique(), // For auth logic
  referred_by_id: text('referred_by_id'), // The affiliate id who referred this affiliate
  name: text('name').notNull(),
  username: text('username').unique(), // Display name in charts
  email: text('email').notNull().unique(),
  phone: text('phone'),
  referral_code: text('referral_code').notNull().unique(),
  status: text('status').default('pending'), // pending, approved, rejected
  total_referred: integer('total_referred').default(0), // Direct invites
  total_network: integer('total_network').default(0), // Tier 2 invites
  total_earned: real('total_earned').default(0),
  balance: real('balance').default(0),
  payment_details: text('payment_details'), // JSON holding bank/paypal info
  terms_accepted: integer('terms_accepted').default(1),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
})

// ============================================
// PAYOUTS (Affiliate Withdrawal Requests)
// ============================================
export const affiliate_payouts = sqliteTable('affiliate_payouts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  affiliate_id: text('affiliate_id').notNull().references(() => affiliates.id),
  amount: real('amount').notNull(),
  status: text('status').default('pending'), // pending, paid, rejected
  notes: text('notes'),
  processed_at: text('processed_at'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// NOTIFICATIONS (In-App Alerts)
// ============================================
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info'), // info, warning, success, error, system
  is_read: integer('is_read').default(0),
  action_url: text('action_url'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

// ============================================
// MARKETING AUTOMATION
// ============================================

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  business_name: text('business_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  city: text('city'),
  status: text('status').default('APPROVED'), // APPROVED, SENT, REJECTED
  source: text('source').default('OSM'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
}, (table) => ({
  nameCityIdx: uniqueIndex('leads_name_city_idx').on(table.business_name, table.city),
}))

export const marketing_posts = sqliteTable('marketing_posts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').references(() => organizations.id),
  content: text('content').notNull(),
  platform: text('platform').notNull(), // fb, ig, tw
  status: text('status').default('APPROVED'), // PENDING, APPROVED, POSTED, FAILED
  scheduled_at: integer('scheduled_at'), // timestamp in ms
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

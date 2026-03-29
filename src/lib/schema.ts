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

  // Meta
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  is_active: integer('is_active').default(1),
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
// SUPPORT TICKETS
// ============================================
export const support_tickets = sqliteTable('support_tickets', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  org_id: text('org_id').notNull().references(() => organizations.id),
  user_id: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull().default('general'), // setup, billing, support
  status: text('status').default('open'), // open, in-progress, resolved
  subject: text('subject').notNull(),
  description: text('description'),
  metadata: text('metadata'), 
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
})

// ============================================
// AFFILIATES (Public Referral Program)
// ============================================
export const affiliates = sqliteTable('affiliates', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  referral_code: text('referral_code').notNull().unique(),
  status: text('status').default('pending'), // pending, approved, rejected
  total_referred: integer('total_referred').default(0),
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
export const payouts = sqliteTable('payouts', {
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
// RELATIONS
// ============================================
export const payoutRelations = relations(payouts, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [payouts.affiliate_id],
    references: [affiliates.id]
  })
}))

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function ensureTableAndColumns(tableName, columns) {
  console.log(`Checking table: ${tableName}`);
  
  // 1. Ensure table exists
  try {
    await client.execute(`SELECT 1 FROM ${tableName} LIMIT 1`);
  } catch (e) {
    if (e.message.includes('no such table')) {
      console.log(`Table ${tableName} missing. Creating basic table with ID...`);
      await client.execute(`CREATE TABLE ${tableName} (id TEXT PRIMARY KEY)`);
    } else {
      console.error(`Error checking table ${tableName}:`, e.message);
      return;
    }
  }

  // 2. Get existing columns
  const res = await client.execute(`PRAGMA table_info(${tableName})`);
  const existingColumns = res.rows.map(r => r.name);

  // 3. Add missing columns
  for (const [colName, colType] of Object.entries(columns)) {
    if (!existingColumns.includes(colName)) {
      console.log(`Adding column ${colName} (${colType}) to ${tableName}...`);
      try {
        await client.execute(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colType}`);
        console.log('SUCCESS');
      } catch (err) {
        console.error(`FAILED to add ${colName}:`, err.message);
      }
    }
  }
}

async function run() {
  console.log('Starting Master Database Sync...');

  await ensureTableAndColumns('organizations', {
    clerk_id: 'TEXT',
    name: 'TEXT NOT NULL',
    slug: 'TEXT NOT NULL UNIQUE',
    wa_phone_number_id: 'TEXT',
    wa_business_account_id: 'TEXT',
    wa_access_token_encrypted: 'TEXT',
    wa_webhook_verified: 'INTEGER DEFAULT 0',
    country: 'TEXT DEFAULT "KE"',
    currency: 'TEXT DEFAULT "KES"',
    language: 'TEXT DEFAULT "en"',
    timezone: 'TEXT DEFAULT "Africa/Nairobi"',
    business_type: 'TEXT',
    logo_url: 'TEXT',
    theme_color: 'TEXT DEFAULT "#25D366"',
    description: 'TEXT',
    business_hours: 'TEXT',
    plan: 'TEXT DEFAULT "trial"',
    trial_ends_at: 'TEXT',
    subscription_id: 'TEXT',
    payment_provider: 'TEXT',
    store_paystack_key_encrypted: 'TEXT',
    store_stripe_account_id: 'TEXT',
    store_paypal_email: 'TEXT',
    store_mpesa_till: 'TEXT',
    store_cod_enabled: 'INTEGER DEFAULT 1',
    store_bank_details: 'TEXT',
    delivery_fee: 'REAL DEFAULT 0',
    free_delivery_above: 'REAL',
    delivery_zones: 'TEXT',
    referral_code: 'TEXT',
    referred_by: 'TEXT',
    payment_mode: 'TEXT DEFAULT "direct"',
    managed_balance: 'REAL DEFAULT 0',
    managed_currency: 'TEXT DEFAULT "KES"',
    managed_payout_details: 'TEXT',
    managed_payout_interval: 'TEXT DEFAULT "weekly"',
    ai_provider: 'TEXT DEFAULT "sella"',
    ai_api_key_encrypted: 'TEXT',
    ai_model: 'TEXT',
    ai_persona: 'TEXT DEFAULT "educator"',
    ai_endpoint_url: 'TEXT',
    ai_system_prompt: 'TEXT',
    bot_menu_style: 'TEXT DEFAULT "professional"',
    bot_emojis_enabled: 'INTEGER DEFAULT 1',
    bot_custom_footer: 'TEXT DEFAULT "Powered by Sella"',
    bot_show_search: 'INTEGER DEFAULT 1',
    bot_show_categories: 'INTEGER DEFAULT 1',
    bot_show_cart: 'INTEGER DEFAULT 1',
    bot_show_orders: 'INTEGER DEFAULT 1',
    usage_ai_daily_count: 'INTEGER DEFAULT 0',
    usage_ai_monthly_count: 'INTEGER DEFAULT 0',
    usage_last_reset_daily: 'TEXT',
    usage_last_reset_monthly: 'TEXT',
    created_at: 'TEXT',
    updated_at: 'TEXT',
    is_active: 'INTEGER DEFAULT 1',
    is_waitlisted: 'INTEGER DEFAULT 0',
    enabled_features: 'TEXT',
  });

  await ensureTableAndColumns('users', {
    clerk_id: 'TEXT NOT NULL UNIQUE',
    org_id: 'TEXT NOT NULL',
    email: 'TEXT NOT NULL',
    name: 'TEXT',
    role: 'TEXT DEFAULT "owner"',
    created_at: 'TEXT',
    is_active: 'INTEGER DEFAULT 1',
    is_super_admin: 'INTEGER DEFAULT 0',
  });

  await ensureTableAndColumns('payouts', {
    org_id: 'TEXT NOT NULL',
    amount: 'REAL NOT NULL',
    currency: 'TEXT DEFAULT "KES"',
    status: 'TEXT DEFAULT "pending"',
    method: 'TEXT',
    reference: 'TEXT',
    created_at: 'TEXT',
  });

  await ensureTableAndColumns('products', {
    org_id: 'TEXT NOT NULL',
    name: 'TEXT NOT NULL',
    description: 'TEXT',
    price: 'REAL NOT NULL',
    compare_at_price: 'REAL',
    currency: 'TEXT DEFAULT "KES"',
    category: 'TEXT DEFAULT "General"',
    images: 'TEXT DEFAULT "[]"',
    variants: 'TEXT DEFAULT "[]"',
    inventory_count: 'INTEGER DEFAULT 0',
    color: 'TEXT',
    metadata: 'TEXT DEFAULT "{}"',
    is_active: 'INTEGER DEFAULT 1',
    type: 'TEXT DEFAULT "physical"',
    digital_content: 'TEXT',
    sort_order: 'INTEGER DEFAULT 0',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('contacts', {
    org_id: 'TEXT NOT NULL',
    phone: 'TEXT NOT NULL',
    name: 'TEXT',
    email: 'TEXT',
    language: 'TEXT DEFAULT "en"',
    tags: 'TEXT DEFAULT "[]"',
    total_orders: 'INTEGER DEFAULT 0',
    total_spent: 'REAL DEFAULT 0',
    last_order_at: 'TEXT',
    notes: 'TEXT',
    loyalty_points: 'INTEGER DEFAULT 0',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('conversations', {
    org_id: 'TEXT NOT NULL',
    contact_id: 'TEXT NOT NULL',
    assigned_to: 'TEXT',
    status: 'TEXT DEFAULT "open"',
    is_bot_active: 'INTEGER DEFAULT 1',
    last_message_at: 'TEXT',
    last_message_preview: 'TEXT',
    unread_count: 'INTEGER DEFAULT 0',
    created_at: 'TEXT',
  });

  await ensureTableAndColumns('messages', {
    org_id: 'TEXT NOT NULL',
    conversation_id: 'TEXT NOT NULL',
    contact_id: 'TEXT NOT NULL',
    direction: 'TEXT NOT NULL',
    content: 'TEXT',
    message_type: 'TEXT DEFAULT "text"',
    wa_message_id: 'TEXT',
    status: 'TEXT DEFAULT "sent"',
    sent_by: 'TEXT',
    metadata: 'TEXT',
    created_at: 'TEXT',
  });

  await ensureTableAndColumns('orders', {
    org_id: 'TEXT NOT NULL',
    contact_id: 'TEXT NOT NULL',
    order_number: 'TEXT NOT NULL',
    items: 'TEXT NOT NULL',
    subtotal: 'REAL NOT NULL',
    delivery_fee: 'REAL DEFAULT 0',
    discount: 'REAL DEFAULT 0',
    total: 'REAL NOT NULL',
    currency: 'TEXT DEFAULT "KES"',
    payment_method: 'TEXT',
    payment_status: 'TEXT DEFAULT "pending"',
    payment_reference: 'TEXT',
    payment_provider: 'TEXT',
    delivery_address: 'TEXT',
    delivery_zone: 'TEXT',
    payment_proof: 'TEXT',
    tracking_number: 'TEXT',
    order_status: 'TEXT DEFAULT "new"',
    notes: 'TEXT',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('carts', {
    org_id: 'TEXT NOT NULL',
    contact_id: 'TEXT NOT NULL',
    items: 'TEXT DEFAULT "[]"',
    total: 'REAL DEFAULT 0',
    currency: 'TEXT DEFAULT "KES"',
    expires_at: 'TEXT',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('auto_replies', {
    org_id: 'TEXT NOT NULL',
    type: 'TEXT NOT NULL',
    keyword: 'TEXT',
    question: 'TEXT',
    response: 'TEXT NOT NULL',
    is_active: 'INTEGER DEFAULT 1',
    sort_order: 'INTEGER DEFAULT 0',
    created_at: 'TEXT',
  });

  await ensureTableAndColumns('sequences', {
    org_id: 'TEXT PRIMARY KEY',
    last_order_number: 'INTEGER DEFAULT 0',
  });

  await ensureTableAndColumns('subscriptions', {
    org_id: 'TEXT NOT NULL UNIQUE',
    plan: 'TEXT NOT NULL DEFAULT "starter"',
    status: 'TEXT NOT NULL DEFAULT "active"',
    provider: 'TEXT NOT NULL',
    amount: 'REAL NOT NULL DEFAULT 0',
    currency: 'TEXT NOT NULL DEFAULT "USD"',
    paystack_subscription_code: 'TEXT',
    stripe_subscription_id: 'TEXT',
    current_period_start: 'TEXT',
    current_period_end: 'TEXT',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('support_tickets', {
    org_id: 'TEXT NOT NULL',
    user_id: 'TEXT NOT NULL',
    type: 'TEXT NOT NULL DEFAULT "general"',
    status: 'TEXT DEFAULT "open"',
    subject: 'TEXT NOT NULL',
    description: 'TEXT',
    metadata: 'TEXT',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('affiliates', {
    name: 'TEXT NOT NULL',
    email: 'TEXT NOT NULL UNIQUE',
    phone: 'TEXT',
    referral_code: 'TEXT NOT NULL UNIQUE',
    status: 'TEXT DEFAULT "pending"',
    total_referred: 'INTEGER DEFAULT 0',
    total_earned: 'REAL DEFAULT 0',
    balance: 'REAL DEFAULT 0',
    payment_details: 'TEXT',
    terms_accepted: 'INTEGER DEFAULT 1',
    created_at: 'TEXT',
    updated_at: 'TEXT',
  });

  await ensureTableAndColumns('affiliate_payouts', {
    affiliate_id: 'TEXT NOT NULL',
    amount: 'REAL NOT NULL',
    status: 'TEXT DEFAULT "pending"',
    notes: 'TEXT',
    processed_at: 'TEXT',
    created_at: 'TEXT',
  });

  await ensureTableAndColumns('notifications', {
    org_id: 'TEXT NOT NULL',
    title: 'TEXT NOT NULL',
    message: 'TEXT NOT NULL',
    type: 'TEXT DEFAULT "info"',
    is_read: 'INTEGER DEFAULT 0',
    action_url: 'TEXT',
    created_at: 'TEXT',
  });

  console.log('Master Database Sync Completed successfully!');
}

run();

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fix() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const queries = [
    // Users table
    'ALTER TABLE users ADD COLUMN is_super_admin INTEGER DEFAULT 0',
    
    // Organizations table - WhatsApp
    'ALTER TABLE organizations ADD COLUMN wa_phone_number_id TEXT',
    'ALTER TABLE organizations ADD COLUMN wa_business_account_id TEXT',
    'ALTER TABLE organizations ADD COLUMN wa_access_token_encrypted TEXT',
    'ALTER TABLE organizations ADD COLUMN wa_webhook_verified INTEGER DEFAULT 0',
    
    // Organizations table - Business Info
    'ALTER TABLE organizations ADD COLUMN country TEXT DEFAULT "KE"',
    'ALTER TABLE organizations ADD COLUMN language TEXT DEFAULT "en"',
    'ALTER TABLE organizations ADD COLUMN business_type TEXT',
    'ALTER TABLE organizations ADD COLUMN logo_url TEXT',
    'ALTER TABLE organizations ADD COLUMN theme_color TEXT DEFAULT "#25D366"',
    'ALTER TABLE organizations ADD COLUMN business_hours TEXT DEFAULT \'{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"09:00","close":"14:00"},"sun":null}\'',
    
    // Organizations table - Subscription
    'ALTER TABLE organizations ADD COLUMN plan TEXT DEFAULT "trial"',
    'ALTER TABLE organizations ADD COLUMN trial_ends_at TEXT',
    'ALTER TABLE organizations ADD COLUMN subscription_id TEXT',
    'ALTER TABLE organizations ADD COLUMN payment_provider TEXT',
    
    // Organizations table - Store Payment Setup
    'ALTER TABLE organizations ADD COLUMN store_paystack_key_encrypted TEXT',
    'ALTER TABLE organizations ADD COLUMN store_stripe_account_id TEXT',
    'ALTER TABLE organizations ADD COLUMN store_paypal_email TEXT',
    'ALTER TABLE organizations ADD COLUMN store_mpesa_till TEXT',
    'ALTER TABLE organizations ADD COLUMN store_cod_enabled INTEGER DEFAULT 1',
    'ALTER TABLE organizations ADD COLUMN store_bank_details TEXT',
    
    // Organizations table - Delivery
    'ALTER TABLE organizations ADD COLUMN delivery_fee REAL DEFAULT 0',
    'ALTER TABLE organizations ADD COLUMN free_delivery_above REAL',
    'ALTER TABLE organizations ADD COLUMN delivery_zones TEXT',
    
    // Organizations table - Referral
    'ALTER TABLE organizations ADD COLUMN referral_code TEXT',
    'ALTER TABLE organizations ADD COLUMN referred_by TEXT',
    
    // Organizations table - Managed Payments
    'ALTER TABLE organizations ADD COLUMN payment_mode TEXT DEFAULT "direct"',
    'ALTER TABLE organizations ADD COLUMN managed_balance REAL DEFAULT 0',
    'ALTER TABLE organizations ADD COLUMN managed_currency TEXT DEFAULT "KES"',
    'ALTER TABLE organizations ADD COLUMN managed_payout_details TEXT',
    'ALTER TABLE organizations ADD COLUMN managed_payout_interval TEXT DEFAULT "weekly"',
    
    // Organizations table - AI
    'ALTER TABLE organizations ADD COLUMN ai_provider TEXT DEFAULT "sella"',
    'ALTER TABLE organizations ADD COLUMN ai_api_key_encrypted TEXT',
    'ALTER TABLE organizations ADD COLUMN ai_model TEXT',
    'ALTER TABLE organizations ADD COLUMN ai_persona TEXT DEFAULT "educator"',
    'ALTER TABLE organizations ADD COLUMN ai_endpoint_url TEXT',
    'ALTER TABLE organizations ADD COLUMN ai_system_prompt TEXT',
    
    // Organizations table - Bot
    'ALTER TABLE organizations ADD COLUMN bot_menu_style TEXT DEFAULT "professional"',
    'ALTER TABLE organizations ADD COLUMN bot_emojis_enabled INTEGER DEFAULT 1',
    'ALTER TABLE organizations ADD COLUMN bot_custom_footer TEXT DEFAULT "Powered by Sella"',
    
    // Payouts table
    'ALTER TABLE payouts ADD COLUMN org_id TEXT',
    'ALTER TABLE payouts ADD COLUMN currency TEXT DEFAULT "KES"',
    'ALTER TABLE payouts ADD COLUMN method TEXT',
    'ALTER TABLE payouts ADD COLUMN reference TEXT',
  ];

  console.log('Connecting to Turso...');
  for (const q of queries) {
    try {
      console.log(`Executing: ${q.substring(0, 50)}...`);
      await client.execute(q);
      console.log('SUCCESS');
    } catch (e) {
      console.log('SKIPPING (likely exists):', e.message);
    }
  }

  console.log('Comprehensive migration complete.');
}

fix();

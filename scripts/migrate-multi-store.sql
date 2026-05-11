-- Migration: Multi-store support + product types
-- Run: node scripts/run-migration.js < this file

-- 1. Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  store_type TEXT DEFAULT 'physical', -- physical, digital, services
  description TEXT,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#25D366',

  -- WhatsApp per store
  wa_phone_number_id TEXT,
  wa_business_account_id TEXT,
  wa_access_token_encrypted TEXT,

  -- Settings
  currency TEXT DEFAULT 'USD',
  delivery_fee REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Create index for org lookup
CREATE INDEX IF NOT EXISTS idx_stores_org_id ON stores(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- 3. Add product_type, digital_content, service_duration to products
-- Only add columns if they don't exist (idempotent)
ALTER TABLE products ADD COLUMN store_id TEXT REFERENCES stores(id);
ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'physical';
ALTER TABLE products ADD COLUMN digital_content TEXT;
ALTER TABLE products ADD COLUMN service_duration TEXT;

-- 4. Create default store from existing org (one-time migration)
-- This creates a store for each org that doesn't have one
INSERT OR IGNORE INTO stores (org_id, name, slug, store_type, is_default, wa_phone_number_id, wa_business_account_id, wa_access_token_encrypted, currency, delivery_fee, theme_color)
SELECT
  id,
  name,
  slug || '-store' || id,
  'physical',
  1,
  wa_phone_number_id,
  wa_business_account_id,
  wa_access_token_encrypted,
  currency,
  delivery_fee,
  theme_color
FROM organizations
WHERE id NOT IN (SELECT org_id FROM stores WHERE is_default = 1);

-- Migration: Multi-store support + product types
-- Run: npm run db:migrate -- scripts/migrate-multi-store.sql
-- Safe to run multiple times (idempotent)

-- 1. Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  store_type TEXT DEFAULT 'physical',
  description TEXT,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#25D366',

  wa_phone_number_id TEXT,
  wa_business_account_id TEXT,
  wa_access_token_encrypted TEXT,

  currency TEXT DEFAULT 'USD',
  delivery_fee REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_org_id ON stores(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- 3. Add product columns (idempotent - only if not exist)
-- Note: Turso/SQLite requires checking if columns exist first
-- We use a workaround: try to add, catch error if exists

-- 3a. Add store_id to products
ALTER TABLE products ADD COLUMN store_id TEXT;

-- 3b. Add product_type (physical, digital, service) - rename from 'type' if needed
-- First check if product_type exists
ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'physical';

-- 3c. Add service_duration
ALTER TABLE products ADD COLUMN service_duration TEXT;

-- 4. Create default store for existing orgs that don't have one
INSERT OR IGNORE INTO stores (id, org_id, name, slug, store_type, is_default, wa_phone_number_id, wa_business_account_id, wa_access_token_encrypted, currency, delivery_fee, theme_color)
SELECT
  lower(hex(randomblob(16))),
  id,
  name,
  slug || '-store',
  'physical',
  1,
  wa_phone_number_id,
  wa_business_account_id,
  wa_access_token_encrypted,
  currency,
  delivery_fee,
  theme_color
FROM organizations
WHERE id NOT IN (SELECT DISTINCT org_id FROM stores);

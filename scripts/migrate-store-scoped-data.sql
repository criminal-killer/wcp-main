-- Migration: Multi-store data scoping
-- Run: npm run db:migrate -- scripts/migrate-store-scoped-data.sql
-- Safe to run multiple times (idempotent)

-- 1. Add active_store_id to users (for persisting user's active store selection)
ALTER TABLE users ADD COLUMN active_store_id TEXT;

-- 2. Add store_id to orders
ALTER TABLE orders ADD COLUMN store_id TEXT;

-- 3. Add store_id to contacts
ALTER TABLE contacts ADD COLUMN store_id TEXT;

-- 4. Add store_id to conversations
ALTER TABLE conversations ADD COLUMN store_id TEXT;

-- 5. Add store_id to messages
ALTER TABLE messages ADD COLUMN store_id TEXT;

-- 6. Add is_live to stores
ALTER TABLE stores ADD COLUMN is_live INTEGER DEFAULT 0;

-- 7. Backfill: Set active_store_id for all users to their org's default store
-- This ensures existing users see their default store when they first use multi-store
UPDATE users
SET active_store_id = (
  SELECT id FROM stores
  WHERE stores.org_id = users.org_id
  AND stores.is_default = 1
  LIMIT 1
)
WHERE active_store_id IS NULL;

-- 8. Backfill: Set store_id for all orders to their org's default store
UPDATE orders
SET store_id = (
  SELECT id FROM stores
  WHERE stores.org_id = orders.org_id
  AND stores.is_default = 1
  LIMIT 1
)
WHERE store_id IS NULL;

-- 9. Backfill: Set store_id for all contacts to their org's default store
UPDATE contacts
SET store_id = (
  SELECT id FROM stores
  WHERE stores.org_id = contacts.org_id
  AND stores.is_default = 1
  LIMIT 1
)
WHERE store_id IS NULL;

-- 10. Backfill: Set store_id for all conversations to their org's default store
UPDATE conversations
SET store_id = (
  SELECT id FROM stores
  WHERE stores.org_id = conversations.org_id
  AND stores.is_default = 1
  LIMIT 1
)
WHERE store_id IS NULL;

-- 11. Backfill: Set store_id for all messages to their org's default store
UPDATE messages
SET store_id = (
  SELECT id FROM stores
  WHERE stores.org_id = messages.org_id
  AND stores.is_default = 1
  LIMIT 1
)
WHERE store_id IS NULL;

-- ============================================================
-- Referrals & Affiliates schema migration
-- Run this once against your Turso DB:
--   turso db shell <your-db-name> < scripts/migrate-referrals.sql
-- All statements use IF NOT EXISTS equivalents via try/catch.
-- SQLite does not support IF NOT EXISTS on ALTER TABLE,
-- so run each statement once and ignore "duplicate column" errors.
-- ============================================================

-- organizations: merchant referral discount tracking
ALTER TABLE organizations ADD COLUMN paying_referrals_count INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN referral_discount_active INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN referral_discount_expires_at TEXT;

-- affiliates: link to Clerk user account for authenticated dashboard
ALTER TABLE affiliates ADD COLUMN clerk_id TEXT;

-- payments_log: idempotency key prevents double-crediting on webhook retries
ALTER TABLE payments_log ADD COLUMN idempotency_key TEXT;

-- referrals: track first vs recurring payment for 40/10% split
ALTER TABLE referrals ADD COLUMN is_first_payment INTEGER DEFAULT 1;
ALTER TABLE referrals ADD COLUMN payment_ref TEXT;

-- Create unique index on payments_log.idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS payments_log_idempotency_idx ON payments_log(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Create unique index on affiliates.clerk_id
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_clerk_id_idx ON affiliates(clerk_id) WHERE clerk_id IS NOT NULL;

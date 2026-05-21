-- Add Meta Commerce Catalog fields to organizations
ALTER TABLE organizations ADD COLUMN meta_business_id TEXT;
ALTER TABLE organizations ADD COLUMN wa_catalog_id TEXT;

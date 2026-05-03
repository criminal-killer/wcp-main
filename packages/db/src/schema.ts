/**
 * packages/db/src/schema.ts
 *
 * Canonical Drizzle ORM schema for the Chatevo platform.
 * Single source of truth for all table definitions.
 *
 * Both apps/merchant and apps/admin import from here via @chatevo/db or @db/*.
 * The path below points to the canonical schema that was moved to apps/merchant/lib/
 */
export * from '../../apps/merchant/lib/schema'

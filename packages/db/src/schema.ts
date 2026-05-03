/**
 * packages/db/src/schema.ts
 *
 * Canonical Drizzle ORM schema for the Chatevo platform.
 * This is the single source of truth for all table definitions.
 *
 * Both apps/merchant and apps/admin import from here via @db/schema.
 * The merchant app's lib/schema.ts re-exports this file.
 * The admin app's lib/schema.ts re-exports this file.
 *
 * IMPORTANT: Do not duplicate this schema in app-local lib/ files.
 * Instead, update THIS file and let the re-exports propagate.
 */

// Re-export everything from the merchant app's canonical schema.
// The merchant app (repo root) is the source of truth for table definitions.
// We use a direct path import because Next.js transpiles workspace packages
// at build time — no separate compilation step needed.
export * from '../../lib/schema'

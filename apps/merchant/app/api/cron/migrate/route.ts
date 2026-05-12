/**
 * API Route: /api/cron/migrate
 * Auto-migration runner for Vercel - runs on a schedule or on-demand
 * Protected by CRON_SECRET header
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

// SQL statements to ensure schema is in sync
// This runs automatically to fix "no such column" and similar errors
const MIGRATION_SQL = [
  // Ensure stores table exists (idempotent)
  `CREATE TABLE IF NOT EXISTS stores (
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
    default_categories TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  // Create indexes (idempotent)
  `CREATE INDEX IF NOT EXISTS idx_stores_org_id ON stores(org_id)`,

  // Add store_id to products if missing
  `ALTER TABLE products ADD COLUMN store_id TEXT`,

  // Add product_type if missing
  `ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'physical'`,

  // Add service_duration if missing
  `ALTER TABLE products ADD COLUMN service_duration TEXT`,
]

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url || !authToken) {
    return NextResponse.json(
      { error: 'Database credentials not configured' },
      { status: 500 }
    )
  }

  const client = createClient({ url, authToken })
  const results: { sql: string; success: boolean; error?: string }[] = []

  for (const sql of MIGRATION_SQL) {
    try {
      await client.execute(sql)
      results.push({ sql: sql.slice(0, 50) + '...', success: true })
    } catch (err: any) {
      const msg = err?.message || String(err)
      // Skip "already exists" errors - these are expected for idempotent migrations
      const isExpected = msg.includes('already exists') ||
                       msg.includes('duplicate column') ||
                       msg.includes('UNIQUE constraint failed')

      results.push({
        sql: sql.slice(0, 50) + '...',
        success: isExpected,
        error: isExpected ? 'skipped (already exists)' : msg,
      })

      if (!isExpected) {
        console.error(`Migration error: ${sql.slice(0, 100)}`)
        console.error(msg)
      }
    }
  }

  client.close()

  const allOk = results.every(r => r.success)
  return NextResponse.json({
    success: allOk,
    migrated: results.filter(r => r.success).length,
    total: results.length,
    results,
  }, { status: allOk ? 200 : 500 })
}

// Allow GET for manual testing (with secret)
export async function GET(request: NextRequest) {
  return POST(request)
}

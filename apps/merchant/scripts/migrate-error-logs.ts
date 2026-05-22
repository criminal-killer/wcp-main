import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const dbUrl = process.env.TURSO_DATABASE_URL
const dbToken = process.env.TURSO_AUTH_TOKEN || undefined

if (!dbUrl) {
  console.error('❌ TURSO_DATABASE_URL is not set')
  process.exit(1)
}

const client = createClient({ url: dbUrl, authToken: dbToken })

async function main() {
  console.log('Creating error_logs table...\n')

  const statements = [
    `CREATE TABLE IF NOT EXISTS error_logs (
      id text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      org_id text NOT NULL REFERENCES organizations(id),
      severity text NOT NULL DEFAULT 'high',
      category text NOT NULL DEFAULT 'general',
      message text NOT NULL,
      cause text,
      fix text,
      stack text,
      status text NOT NULL DEFAULT 'open',
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text
    )`,
    'CREATE INDEX IF NOT EXISTS idx_error_logs_org_id ON error_logs(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status)',
    'CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity)',
    'CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at)',
  ]

  for (const sql of statements) {
    try {
      await client.execute(sql)
      console.log(`✅ ${sql.slice(0, 60)}...`)
    } catch (err: any) {
      console.error(`❌ ${sql.slice(0, 60)}...`)
      console.error(err.message || err)
    }
  }

  console.log('\nDone. error_logs table ready.')
}

main().catch(console.error)

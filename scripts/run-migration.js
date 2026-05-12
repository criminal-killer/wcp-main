/**
 * Run a SQL migration file against the Turso database.
 * Usage: node scripts/run-migration.js < migration-file.sql
 *
 * Or: node scripts/run-migration.js migration-file.sql
 * Or: node scripts/run-migration.js --query "SELECT 1"
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

// Load .env file if present
config()

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env or environment.')
  process.exit(1)
}

const client = createClient({ url, authToken })

async function main() {
  const fileArg = process.argv[2]
  const isQuery = process.argv.includes('--query')

  if (isQuery && fileArg) {
    // Run a single query
    const query = process.argv.slice(3).join(' ')
    console.log('Query:', query)
    try {
      const result = await client.execute(query)
      console.log('Result:', JSON.stringify(result.rows, null, 2))
    } catch (err) {
      console.error('Error:', err.message)
    }
    client.close()
    return
  }

  let sql

  if (fileArg && !fileArg.startsWith('--')) {
    const filePath = resolve(process.cwd(), fileArg)
    sql = readFileSync(filePath, 'utf-8')
    console.log(`Running migration from: ${filePath}`)
  } else {
    // Read from stdin
    sql = await new Promise((resolve, reject) => {
      let data = ''
      process.stdin.on('data', chunk => data += chunk)
      process.stdin.on('end', () => resolve(data))
      process.stdin.on('error', reject)
    })
    console.log('Running migration from stdin...')
  }

  // Split into individual statements (split on semicolons, handle various line endings)
  const statements = sql
    .split(/;[ \t]*[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Executing ${statements.length} statement(s)...\n`)

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      console.log('OK:', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''))
    } catch (err) {
      // Extract meaningful part of error
      const msg = err.message || String(err)
      // Skip expected "already exists" type errors for idempotent migrations
      const isExpectedError = msg.includes('already exists') ||
                             msg.includes('duplicate column') ||
                             msg.includes('duplicate row') ||
                             msg.includes('UNIQUE constraint failed')
      if (isExpectedError) {
        console.log('SKIP (already exists):', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''))
      } else {
        console.error('ERROR:', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''))
        console.error('       ', msg)
      }
    }
  }

  console.log('\nMigration complete!')
  client.close()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

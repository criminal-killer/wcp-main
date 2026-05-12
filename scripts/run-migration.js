/**
 * Run a SQL migration file against the Turso database.
 * Usage: node scripts/run-migration.js < migration-file.sql
 *
 * Or: node scripts/run-migration.js migration-file.sql
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env or environment.')
  process.exit(1)
}

const client = createClient({ url, authToken })

async function main() {
  let sql

  // Support both: node run-migration.js < file.sql  and  node run-migration.js file.sql
  const fileArg = process.argv[2]
  if (fileArg) {
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

  // Split into individual statements (simple split on semicolons)
  // For more complex files, you may need to split more carefully
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Executing ${statements.length} statement(s)...\n`)

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      console.log('OK:', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''))
    } catch (err) {
      console.error('ERROR:', stmt.slice(0, 80) + (stmt.length > 80 ? '...' : ''))
      console.error('       ', err.message)
      // Continue with next statement for idempotent migrations
    }
  }

  console.log('\nMigration complete!')
  client.close()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

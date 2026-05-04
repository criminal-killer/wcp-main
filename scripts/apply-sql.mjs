import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
try { await import('dotenv/config') } catch { /* Ignore if dotenv is missing */ }

const sqlFilePath = process.argv[2]

if (!sqlFilePath) {
  console.error('\n❌ Error: Please provide a SQL file path.')
  console.error('Usage: node scripts/apply-sql.mjs <path-to-sql-file>\n')
  process.exit(1)
}

if (!process.env.TURSO_DATABASE_URL) {
  console.error('\n❌ Error: TURSO_DATABASE_URL is missing.')
  console.error('Please ensure your environment variables are set or a .env file exists.\n')
  process.exit(1)
}

try {
  const fullPath = path.resolve(process.cwd(), sqlFilePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`\n❌ Error: File not found at ${fullPath}\n`)
    process.exit(1)
  }

  console.log(`\n📄 Reading SQL file: ${sqlFilePath}`)
  const rawSql = fs.readFileSync(fullPath, 'utf-8')

  // Split by semicolon, filter out empty lines and lines that are just comments
  const statements = rawSql
    .split(';')
    .map(stmt => stmt.trim())
    // Filter out empty statements
    .filter(stmt => stmt.length > 0)
    // Filter out statements that consist entirely of SQL comments
    .filter(stmt => {
      const lines = stmt.split('\n').map(line => line.trim())
      const nonCommentLines = lines.filter(line => line.length > 0 && !line.startsWith('--'))
      return nonCommentLines.length > 0
    })

  if (statements.length === 0) {
    console.log('⚠️ No valid SQL statements found in file. Exiting.')
    process.exit(0)
  }

  console.log(`\n🔗 Connecting to Turso database: ${process.env.TURSO_DATABASE_URL}`)
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log(`\n📦 Executing ${statements.length} statements in a batch transaction...\n`)
  
  statements.forEach((stmt, index) => {
    console.log(`[Statement ${index + 1}/${statements.length}]`)
    console.log(`${stmt};`)
    console.log('-'.repeat(40))
  })

  // Execute all in one transaction
  await client.batch(statements)

  console.log('\n✅ Success! All SQL statements applied successfully.\n')

} catch (error) {
  console.error('\n❌ Failed to apply SQL migration:\n', error)
  process.exit(1)
}

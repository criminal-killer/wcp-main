import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
try {
  const dotenv = await import('dotenv')
  const envPaths = [
    '.env.local',
    '.env',
    'apps/merchant/.env.local',
    'apps/admin/.env.local'
  ]
  let loadedPath = null
  for (const p of envPaths) {
    const fullEnvPath = path.resolve(process.cwd(), p)
    if (fs.existsSync(fullEnvPath)) {
      dotenv.config({ path: fullEnvPath })
      loadedPath = p
      break
    }
  }
  if (loadedPath) {
    console.log(`\n🔑 Loaded environment variables from: ${loadedPath}`)
  } else {
    console.log(`\n🔑 No local .env file found, using process.env`)
  }
} catch { 
  console.log(`\n🔑 'dotenv' package not found, using process.env`)
}

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

  // Strip out SQL comments before execution:
  // - Remove lines starting with "--"
  // - Then join lines and split by ';'
  const statements = rawSql
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('--'))
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0)

  if (statements.length === 0) {
    console.log('⚠️ No valid SQL statements found in file. Exiting.')
    process.exit(0)
  }

  console.log(`\n🔗 Connecting to Turso database: ${process.env.TURSO_DATABASE_URL}`)
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log(`\n📦 Executing ${statements.length} statements sequentially...\n`)
  
  let appliedCount = 0
  let skippedCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    console.log(`[Statement ${i + 1}/${statements.length}]`)
    console.log(`${stmt};`)
    console.log('-'.repeat(40))

    try {
      await client.execute(stmt)
      console.log('✅ APPLIED\n')
      appliedCount++
    } catch (err) {
      const errMsg = err.message || String(err)
      if (
        errMsg.includes('duplicate column name') ||
        errMsg.includes('already exists') ||
        errMsg.includes('duplicate index')
      ) {
        console.log('⏭️ SKIP (already applied)\n')
        skippedCount++
      } else {
        console.error(`\n❌ FAILED at statement ${i + 1}:`, err)
        console.log(`\n📊 Summary: ${appliedCount} applied, ${skippedCount} skipped. Failed at index ${i + 1}.`)
        process.exit(1)
      }
    }
  }

  console.log(`\n✅ Done! Summary: ${appliedCount} applied, ${skippedCount} skipped.\n`)

} catch (error) {
  console.error('\n❌ Failed to apply SQL migration:\n', error)
  process.exit(1)
}

import 'dotenv/config'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('Missing TURSO_DATABASE_URL')
  process.exit(1)
}

const c = createClient({ url, authToken })

const tables = ['organizations', 'affiliates', 'referrals', 'payments_log']

for (const t of tables) {
  const r = await c.execute({ sql: `PRAGMA table_info(${t});` })
  console.log(`\n== ${t} ==`)
  console.table(r.rows.map(x => ({ name: x.name, type: x.type })))
}

const idx = await c.execute({
  sql: `SELECT name, tbl_name, sql FROM sqlite_master
        WHERE type='index'
        AND name IN ('payments_log_idempotency_idx','affiliates_clerk_id_idx');`
})
console.log('\n== indexes ==')
console.table(idx.rows)
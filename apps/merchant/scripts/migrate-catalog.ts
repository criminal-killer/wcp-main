import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const url = process.env.TURSO_DATABASE_URL!
const authToken = process.env.TURSO_AUTH_TOKEN!

async function main() {
  const client = createClient({ url, authToken })

  const migrations = [
    'ALTER TABLE organizations ADD COLUMN meta_business_id text',
    'ALTER TABLE organizations ADD COLUMN wa_catalog_id text',
    'ALTER TABLE organizations ADD COLUMN category_mapping text',
  ]

  for (const sql of migrations) {
    const col = sql.match(/ADD COLUMN (\w+)/)?.[1] || ''
    try {
      await client.execute(sql)
      console.log(`✅ Added ${col}`)
    } catch (err: any) {
      if (err.message?.includes('duplicate column name')) {
        console.log(`ℹ️  ${col} already exists, skipping`)
      } else {
        console.error(`❌ ${col}: ${err.message}`)
      }
    }
  }

  await client.close()
}

main()

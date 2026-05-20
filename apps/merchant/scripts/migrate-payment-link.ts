import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const url = process.env.TURSO_DATABASE_URL!
const authToken = process.env.TURSO_AUTH_TOKEN!

async function main() {
  const client = createClient({ url, authToken })
  
  console.log('Adding payment_link column...')
  try {
    await client.execute('ALTER TABLE orders ADD COLUMN payment_link text')
    console.log('✅ Migration successful!')
  } catch (err: any) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️ Column already exists, skipping')
    } else {
      console.error('❌ Error:', err.message)
    }
  }
  
  await client.close()
}

main()
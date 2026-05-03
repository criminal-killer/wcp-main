import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'

// Lazy singleton — createClient() is NOT called at module evaluation time.
// This prevents the build-time crash: "URL_INVALID: The URL 'undefined' is not
// in a valid format" that occurs when Next.js pre-renders pages without env vars.
let _db: LibSQLDatabase<typeof schema> | null = null

export function getDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is missing. Create .env.local or set the env var before starting the server.'
    )
  }

  const client: Client = createClient({ url, authToken })
  _db = drizzle(client, { schema })
  return _db
}

// Drop-in alias so existing `import { db } from "@/lib/db"` callers keep working.
// The Proxy defers the createClient() call until the first property access,
// which only happens at request time — never during static build analysis.
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

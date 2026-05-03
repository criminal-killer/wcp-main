/**
 * lib/db.ts — Merchant App DB client
 *
 * Lazy Turso/libSQL + Drizzle client.
 * createClient() is NOT called at module load time — only on first DB access.
 * This prevents build-time crashes when TURSO_DATABASE_URL is not set.
 *
 * The shared implementation lives in packages/db/src/client.ts.
 * This file re-exports from there for Next.js path alias compatibility.
 */
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'

let _db: LibSQLDatabase<typeof schema> | null = null

export function getDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error(
      '[chatevo/merchant] TURSO_DATABASE_URL is missing. ' +
      'Copy .env.example to .env.local and fill in your Turso credentials.'
    )
  }

  const client: Client = createClient({ url, authToken })
  _db = drizzle(client, { schema })
  return _db
}

/**
 * db — Drop-in Proxy that defers DB init until first property access at request time.
 * All existing `import { db } from "@/lib/db"` callers work without changes.
 */
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

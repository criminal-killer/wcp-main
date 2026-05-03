/**
 * packages/db/src/client.ts
 *
 * Lazy Turso/libSQL + Drizzle client — safe to import at module load time
 * even when TURSO_DATABASE_URL is not set (e.g. during `next build`).
 * createClient() is deferred until the first DB call at request time.
 */
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'

export type DbSchema = typeof schema

let _db: LibSQLDatabase<DbSchema> | null = null

/**
 * getDb() — Returns the singleton Drizzle client, initializing it on first call.
 * Throws a clear error if TURSO_DATABASE_URL is missing at runtime.
 */
export function getDb(): LibSQLDatabase<DbSchema> {
  if (_db) return _db

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error(
      '[chatevo/db] TURSO_DATABASE_URL is missing. ' +
      'Copy .env.example to .env.local and fill in your Turso credentials.'
    )
  }

  const client: Client = createClient({ url, authToken })
  _db = drizzle(client, { schema })
  return _db
}

/**
 * db — Drop-in Proxy that defers getDb() until first property access.
 * Existing `import { db } from "@/lib/db"` callers work without changes.
 */
export const db = new Proxy({} as LibSQLDatabase<DbSchema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

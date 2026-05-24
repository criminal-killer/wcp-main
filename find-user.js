// Utility to find a user by email in the Turso database.
// Uses environment variables for database connection (never hardcode credentials).

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  clerk_id: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
});

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  const allUsers = await db.select().from(users).limit(10);
  console.log(JSON.stringify(allUsers, null, 2));
}

main().catch(console.error);

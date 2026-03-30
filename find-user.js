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
  const client = createClient({
    url: "libsql://sella-db-criminal-dev.aws-ap-northeast-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0MjQ2MTIsImlkIjoiMDE5ZDIzY2EtZGIwMS03YjQxLTgyMTYtZTU1Y2Y4YjU1MDNiIiwicmlkIjoiMzgwNjgwMTItMjFiOS00ZjMzLTk1Y2QtNGRmMzg1M2ViYmVmIn0.EesUHsoeOXVbPQRMYgue7BxSMrEDsYobTjXWxEX1oX4XcJY2dST5PESWP9y0uVLDA1TgvsGuHNZL2je0j7CFCA",
  });
  const db = drizzle(client);

  const allUsers = await db.select().from(users).limit(10);
  console.log(JSON.stringify(allUsers, null, 2));
}

main().catch(console.error);

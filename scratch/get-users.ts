import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function run() {
  const rs = await client.execute('SELECT clerk_id, email, name, role FROM users');
  console.log(JSON.stringify(rs.rows, null, 2));
}

run();

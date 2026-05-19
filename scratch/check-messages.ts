import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function run() {
  console.log('Fetching last 10 messages from database...');
  const rs = await client.execute({
    sql: 'SELECT id, conversation_id, org_id, direction, content, message_type, status, created_at FROM messages ORDER BY id DESC LIMIT 10'
  });
  console.log(JSON.stringify(rs.rows, null, 2));
}

run();

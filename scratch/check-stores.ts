import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function run() {
  const rs = await client.execute({
    sql: 'SELECT id, name, org_id, wa_phone_number_id FROM stores WHERE org_id = ?',
    args: ['484f3cd235ffa107731ef729b905cb38']
  });
  console.log('Stores under Alfred Store Org:', JSON.stringify(rs.rows, null, 2));
}

run();

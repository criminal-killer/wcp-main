import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function run() {
  console.log('Querying organization and store details for 9f1176239418e47ce88f8db807417657...');
  const orgRes = await client.execute({
    sql: 'SELECT id, name, wa_phone_number_id FROM organizations WHERE id = ?',
    args: ['9f1176239418e47ce88f8db807417657']
  });
  console.log('Org:', orgRes.rows);

  const storeRes = await client.execute({
    sql: 'SELECT id, name, wa_phone_number_id FROM stores WHERE org_id = ?',
    args: ['9f1176239418e47ce88f8db807417657']
  });
  console.log('Stores:', storeRes.rows);
}

run();

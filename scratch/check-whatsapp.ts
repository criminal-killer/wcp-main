import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function run() {
  console.log('--- STORES TABLE ---');
  const stores = await client.execute('SELECT id, name, org_id, wa_phone_number_id FROM stores');
  console.log(JSON.stringify(stores.rows, null, 2));

  console.log('\n--- ORGANIZATIONS TABLE ---');
  const orgs = await client.execute('SELECT id, name, wa_phone_number_id, wa_webhook_verified, LENGTH(wa_access_token_encrypted) as token_len FROM organizations');
  console.log(JSON.stringify(orgs.rows, null, 2));
}

run();

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

async function run() {
  console.log('Starting duplicate phone ID cleanup...');
  
  // Update old Alfred Store (9f1176239418e47ce88f8db807417657)
  const res1 = await client.execute({
    sql: 'UPDATE organizations SET wa_phone_number_id = NULL WHERE id = ?',
    args: ['9f1176239418e47ce88f8db807417657']
  });
  console.log('Cleared old Alfred Store phone ID:', res1.rowsAffected);

  // Update Ashley Shop (f16508907d6d97ad9d8bfc4fd5a90d54)
  const res2 = await client.execute({
    sql: 'UPDATE organizations SET wa_phone_number_id = NULL WHERE id = ?',
    args: ['f16508907d6d97ad9d8bfc4fd5a90d54']
  });
  console.log('Cleared Ashley Shop phone ID:', res2.rowsAffected);

  console.log('Cleanup finished!');
}

run();

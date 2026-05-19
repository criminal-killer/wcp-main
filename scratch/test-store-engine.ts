import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;

function decrypt(encryptedText: string): string {
  const key = process.env.ENCRYPTION_KEY!;
  const keyBuf = Buffer.from(key.slice(0, KEY_LENGTH), 'utf8');
  const parts = encryptedText.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted text format');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// Inline DB query replacements for the test since we're using raw client
async function run() {
  console.log('Setting up mock context...');
  
  // 1. Get org
  const orgRes = await client.execute({
    sql: 'SELECT * FROM organizations WHERE id = ?',
    args: ['484f3cd235ffa107731ef729b905cb38']
  });
  if (orgRes.rows.length === 0) throw new Error('Org not found');
  const org = orgRes.rows[0];

  // 2. Get decrypted access token
  const accessToken = decrypt(org.wa_access_token_encrypted as string);

  // Import the real modules from apps/merchant
  const { processIncomingMessage } = await import('../apps/merchant/lib/store-engine');

  // Let's mock a contact and a conversation
  const contact = {
    id: 'test_contact_id',
    org_id: org.id as string,
    phone: '254762667048',
    email: 'test@customer.com',
    name: 'Test Customer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_orders: 0,
    total_spent: 0,
  };

  const conversation = {
    id: 'test_conv_id',
    org_id: org.id as string,
    contact_id: 'test_contact_id',
    is_bot_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const message = {
    from: '254762667048',
    id: 'wamid.mock_' + Date.now(),
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type: 'text',
    text: {
      body: 'Hi',
    },
  };

  console.log('Invoking processIncomingMessage...');
  try {
    const result = await processIncomingMessage({
      org: org as any,
      store: null,
      contact: contact as any,
      conversation: conversation as any,
      message,
      accessToken,
    });
    console.log('Success! Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('CRASH inside processIncomingMessage:', err);
  }
}

run();

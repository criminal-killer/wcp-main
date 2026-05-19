import { createClient } from '@libsql/client';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
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
  if (parts.length !== 2) return 'DECRYPT_FORMAT_ERROR';
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e: any) {
    return 'DECRYPT_FAIL: ' + e.message;
  }
}

async function run() {
  console.log('Querying all duplicate organizations for Phone ID: 1085651847960327...');
  const rs = await client.execute({
    sql: 'SELECT id, name, wa_phone_number_id, wa_access_token_encrypted, wa_webhook_verified, created_at, updated_at FROM organizations WHERE wa_phone_number_id = ?',
    args: ['1085651847960327']
  });

  for (const row of rs.rows) {
    const token = row.wa_access_token_encrypted as string;
    const decrypted = token ? decrypt(token) : 'NONE';
    console.log({
      id: row.id,
      name: row.name,
      wa_phone_number_id: row.wa_phone_number_id,
      wa_webhook_verified: row.wa_webhook_verified,
      created_at: row.created_at,
      updated_at: row.updated_at,
      token_preview: decrypted !== 'NONE' ? decrypted.slice(0, 15) + '...' : 'NONE',
      token_length: decrypted.length,
    });
  }
}

run();

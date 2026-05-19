import { createClient } from '@libsql/client';
import crypto from 'crypto';
import fetch from 'node-fetch';
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
  if (parts.length !== 2) throw new Error('Invalid encrypted text format');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

async function run() {
  console.log('Fetching credentials for Alfred Store...');
  const rs = await client.execute({
    sql: 'SELECT wa_phone_number_id, wa_access_token_encrypted FROM organizations WHERE id = ?',
    args: ['484f3cd235ffa107731ef729b905cb38']
  });

  if (rs.rows.length === 0) {
    console.error('Alfred Store organization not found!');
    return;
  }

  const row = rs.rows[0];
  const phoneNumberId = row.wa_phone_number_id as string;
  const encryptedToken = row.wa_access_token_encrypted as string;

  if (!phoneNumberId || !encryptedToken) {
    console.error('Missing WhatsApp Phone ID or Access Token in database!');
    return;
  }

  console.log('Phone ID:', phoneNumberId);
  let accessToken = '';
  try {
    accessToken = decrypt(encryptedToken);
    console.log('Access Token decrypted successfully. (Length:', accessToken.length, ')');
  } catch (err) {
    console.error('Failed to decrypt access token:', err);
    return;
  }

  const testPhone = '254762667048';
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: testPhone,
    type: 'text',
    text: { body: 'Test message from Chatevo Backend Debugger!' }
  };

  console.log('Sending message to Meta API...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Meta API Response Status:', res.status);
    const text = await res.text();
    console.log('Meta API Response Body:', text);
  } catch (err) {
    console.error('Network error during Meta send:', err);
  }
}

run();

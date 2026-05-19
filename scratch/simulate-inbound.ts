import crypto from 'crypto';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const appSecret = process.env.WHATSAPP_APP_SECRET || '';
const webhookUrl = 'https://www.chatsevo.com/api/webhook';

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '123456',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              phone_number_id: '1085651847960327',
            },
            contacts: [
              {
                profile: {
                  name: 'Alfred Test Customer',
                },
                wa_id: '254762667048',
              },
            ],
            messages: [
              {
                from: '254762667048',
                id: 'wamid.test_' + Date.now(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'text',
                text: {
                  body: 'Hi',
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

async function test() {
  const bodyString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', appSecret)
    .update(bodyString)
    .digest('hex');

  console.log('Sending mock webhook to:', webhookUrl);
  console.log('Calculated Signature:', `sha256=${signature}`);
  
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': `sha256=${signature}`,
      },
      body: bodyString,
    });

    console.log('Response Status:', res.status);
    console.log('Response Text:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();

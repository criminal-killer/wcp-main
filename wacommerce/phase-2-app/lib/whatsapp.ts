/**
 * Meta WhatsApp Cloud API Client
 * Sends messages using org's WhatsApp credentials
 */

const WHATSAPP_API_VERSION = 'v21.0'
const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

interface WhatsAppCredentials {
  phoneNumberId: string
  accessToken: string
}

interface TextMessage {
  to: string
  body: string
}

interface ImageMessage {
  to: string
  imageUrl: string
  caption?: string
}

interface InteractiveButtonMessage {
  to: string
  bodyText: string
  buttons: Array<{ id: string; title: string }>
  headerText?: string
  footerText?: string
}

interface InteractiveListMessage {
  to: string
  bodyText: string
  buttonText: string
  sections: Array<{
    title: string
    rows: Array<{ id: string; title: string; description?: string }>
  }>
}

async function sendWhatsAppRequest(
  credentials: WhatsAppCredentials,
  payload: Record<string, unknown>
): Promise<{ id?: string; error?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/${credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
      }
    )
    const data = await response.json() as Record<string, unknown>
    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return { error: JSON.stringify(data) }
    }
    const messages = data.messages as Array<{ id: string }> | undefined
    return { id: messages?.[0]?.id }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { error: String(error) }
  }
}

export async function sendTextMessage(
  credentials: WhatsAppCredentials,
  { to, body }: TextMessage
) {
  return sendWhatsAppRequest(credentials, {
    to,
    type: 'text',
    text: { body, preview_url: false },
  })
}

export async function sendImageMessage(
  credentials: WhatsAppCredentials,
  { to, imageUrl, caption }: ImageMessage
) {
  return sendWhatsAppRequest(credentials, {
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  })
}

export async function sendInteractiveButtonMessage(
  credentials: WhatsAppCredentials,
  { to, bodyText, buttons, headerText, footerText }: InteractiveButtonMessage
) {
  const payload: Record<string, unknown> = {
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  }
  if (headerText) {
    (payload.interactive as Record<string, unknown>).header = { type: 'text', text: headerText }
  }
  if (footerText) {
    (payload.interactive as Record<string, unknown>).footer = { text: footerText }
  }
  return sendWhatsAppRequest(credentials, payload)
}

export async function sendInteractiveListMessage(
  credentials: WhatsAppCredentials,
  { to, bodyText, buttonText, sections }: InteractiveListMessage
) {
  return sendWhatsAppRequest(credentials, {
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: { button: buttonText, sections },
    },
  })
}

export async function markMessageRead(
  credentials: WhatsAppCredentials,
  waMessageId: string
) {
  return sendWhatsAppRequest(credentials, {
    status: 'read',
    message_id: waMessageId,
  })
}

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  appSecret: string
): Promise<boolean> {
  const crypto = await import('crypto')
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex')
  return `sha256=${expectedSig}` === signature
}

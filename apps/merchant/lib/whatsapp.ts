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
  body: string
  buttons: Array<{ id: string; title: string }>
  header?: string
  footer?: string
  imageUrl?: string
}

interface InteractiveListMessage {
  to: string
  body: string
  buttonText: string
  sections: Array<{
    title: string
    rows: Array<{ id: string; title: string; description?: string }>
  }>
  header?: string
  footer?: string
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
  try {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      console.warn('Invalid or missing image URL, skipping image message')
      return null
    }
    const url = new URL(imageUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn('Image URL must use http or https protocol')
      return null
    }
  } catch {
    console.warn('Malformed image URL, skipping image message')
    return null
  }
  return sendWhatsAppRequest(credentials, {
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  })
}

export async function sendInteractiveButtonMessage(
  credentials: WhatsAppCredentials,
  { to, body, buttons, header, footer, imageUrl }: InteractiveButtonMessage
) {
  const payload: Record<string, unknown> = {
    to,
    messaging_product: 'whatsapp',
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  }
  if (imageUrl) {
    (payload.interactive as Record<string, unknown>).header = { type: 'image', image: { link: imageUrl } }
  } else if (header) {
    (payload.interactive as Record<string, unknown>).header = { type: 'text', text: header }
  }
  if (footer) {
    (payload.interactive as Record<string, unknown>).footer = { text: footer }
  }
  return sendWhatsAppRequest(credentials, payload)
}

export async function sendInteractiveCTAUrlMessage(
  credentials: WhatsAppCredentials,
  { to, body, url, buttonText, header, footer }: { to: string; body: string; url: string; buttonText: string; header?: string; footer?: string }
) {
  const payload: Record<string, unknown> = {
    to,
    messaging_product: 'whatsapp',
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: body },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: buttonText,
          url,
        },
      },
    },
  }
  if (header) {
    (payload.interactive as Record<string, unknown>).header = { type: 'text', text: header }
  }
  if (footer) {
    (payload.interactive as Record<string, unknown>).footer = { text: footer }
  }
  return sendWhatsAppRequest(credentials, payload)
}

export async function sendInteractiveListMessage(
  credentials: WhatsAppCredentials,
  { to, body, buttonText, sections, header, footer }: InteractiveListMessage
) {
  const payload: Record<string, unknown> = {
    to,
    messaging_product: 'whatsapp',
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: { button: buttonText, sections },
    },
  }
  if (header) {
    (payload.interactive as Record<string, unknown>).header = { type: 'text', text: header }
  }
  if (footer) {
    (payload.interactive as Record<string, unknown>).footer = { text: footer }
  }
  return sendWhatsAppRequest(credentials, payload)
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

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, contacts, conversations, messages } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { verifyWebhookSignature } from '@/lib/whatsapp'
import { getCachedOrg, setCachedOrg, getFlowState, setFlowState, deleteFlowState, getCart, setCart, clearCart } from '@/lib/redis'
import { decrypt } from '@/lib/encryption'
import { processIncomingMessage } from '@/lib/store-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-hub-signature-256') || ''

  // Verify meta webhook signature
  const appSecret = process.env.META_APP_SECRET || ''
  if (appSecret && !verifyWebhookSignature(body, signature, appSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: {
    object: string
    entry: Array<{
      id: string
      changes: Array<{
        field: string
        value: {
          messaging_product: string
          statuses?: Array<{ id: string; status: string; timestamp: string }>
          messages?: Array<{
            from: string
            id: string
            timestamp: string
            type: string
            text?: { body: string }
            interactive?: {
              type: string
              button_reply?: { id: string; title: string }
              list_reply?: { id: string; title: string }
            }
          }>
          contacts?: Array<{ profile: { name: string }; wa_id: string }>
          metadata?: { phone_number_id: string }
        }
      }>
    }>
  }

  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.object !== 'whatsapp_business_account') {
    return NextResponse.json({ received: true })
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue

      const value = change.value
      const phoneNumberId = value.metadata?.phone_number_id
      if (!phoneNumberId) continue

      // Find org by phone number ID — check Redis cache first (avoids full table scan on every message)
      let org = await getCachedOrg(phoneNumberId) as typeof organizations.$inferSelect | null
      if (!org) {
        org = await db.query.organizations.findFirst({
          where: eq(organizations.wa_phone_number_id, phoneNumberId),
        }) || null
        if (org) {
          await setCachedOrg(phoneNumberId, org) // Cache for 5 minutes
        }
      }
      if (!org) continue

      // Auto-activate webhook status on first successful message
      if (!org.wa_webhook_verified) {
        await db.update(organizations).set({ wa_webhook_verified: 1 }).where(eq(organizations.id, org.id))
      }

      const accessToken = org.wa_access_token_encrypted
        ? decrypt(org.wa_access_token_encrypted)
        : null
      if (!accessToken) continue

      // Process each incoming message
      for (const msg of value.messages || []) {
        const senderPhone = msg.from
        const waContactName = value.contacts?.[0]?.profile?.name || senderPhone

        // Upsert contact
        let contact = await db.query.contacts.findFirst({
          where: and(eq(contacts.org_id, org.id), eq(contacts.phone, senderPhone)),
        })

        if (!contact) {
          const [newContact] = await db.insert(contacts).values({
            org_id: org.id,
            phone: senderPhone,
            name: waContactName,
          }).returning()
          contact = newContact
        } else if (contact.name !== waContactName && waContactName !== senderPhone) {
          await db.update(contacts).set({ name: waContactName }).where(eq(contacts.id, contact.id))
        }

        // Upsert conversation
        let conversation = await db.query.conversations.findFirst({
          where: and(eq(conversations.org_id, org.id), eq(conversations.contact_id, contact.id)),
        })

        const msgPreview = msg.text?.body?.slice(0, 100) || '[interactive]'
        if (!conversation) {
          const [newConv] = await db.insert(conversations).values({
            org_id: org.id,
            contact_id: contact.id,
            status: 'active',
            is_bot_active: 1,
            last_message_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            last_message_preview: msgPreview,
            unread_count: 1,
          }).returning()
          conversation = newConv
        } else {
          await db.update(conversations).set({
            last_message_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            last_message_preview: msgPreview,
            unread_count: (conversation.unread_count || 0) + 1,
            status: 'active',
          }).where(eq(conversations.id, conversation.id))
        }

        // Save inbound message
        await db.insert(messages).values({
          org_id: org.id,
          conversation_id: conversation.id,
          contact_id: contact.id,
          wa_message_id: msg.id,
          direction: 'inbound',
          content: msg.text?.body || msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '',
          message_type: msg.type,
          status: 'delivered',
        })

        // Process via store engine if bot is active
        if (conversation.is_bot_active) {
          try {
            await processIncomingMessage({
              org,
              contact,
              conversation,
              message: msg,
              accessToken,
            })
          } catch (err) {
            console.error('Store engine error:', err)
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

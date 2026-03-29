import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, messages, conversations, organizations, contacts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as {
    conversation_id: string
    contact_id?: string
    content: string
    message_type?: string
  }

  const { conversation_id, content, message_type = 'text' } = body
  if (!conversation_id || !content) {
    return NextResponse.json({ error: 'conversation_id and content required' }, { status: 400 })
  }

  const conversation = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, conversation_id), eq(conversations.org_id, user.org_id)),
  })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, conversation.contact_id),
  })

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })

  let waMessageId: string | undefined
  // Send via WhatsApp if credentials exist
  if (org?.wa_phone_number_id && org?.wa_access_token_encrypted && contact?.phone) {
    try {
      const accessToken = decrypt(org.wa_access_token_encrypted)
      const result = await sendTextMessage(
        { phoneNumberId: org.wa_phone_number_id, accessToken },
        { to: contact.phone, body: content }
      )
      waMessageId = result.id
    } catch (err) {
      console.error('Failed to send WhatsApp message:', err)
    }
  }

  // Save to DB
  const [msg] = await db.insert(messages).values({
    org_id: user.org_id,
    conversation_id,
    contact_id: conversation.contact_id,
    direction: 'outbound',
    content,
    message_type,
    wa_message_id: waMessageId,
    status: waMessageId ? 'sent' : 'failed',
    sent_by: user.id,
  }).returning()

  // Update conversation
  await db.update(conversations)
    .set({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.slice(0, 100),
      is_bot_active: 0, // Switch to human mode when agent replies
    })
    .where(eq(conversations.id, conversation_id))

  return NextResponse.json({ data: msg, message: 'Message sent' })
}

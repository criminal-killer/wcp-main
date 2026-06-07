import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, contacts, conversations, messages, notifications } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, params.slug),
    })
    if (!org) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { name, phone, message: requestMessage } = await req.json()
    if (!phone) return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    if (!requestMessage) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const phoneClean = phone.replace(/\D/g, '')

    // Find or create contact
    let contact = await db.query.contacts.findFirst({
      where: eq(contacts.phone, phoneClean),
    })
    if (!contact) {
      const [newContact] = await db.insert(contacts).values({
        org_id: org.id,
        phone: phoneClean,
        name: name || phoneClean,
        notes: `Request: ${requestMessage}`,
      }).returning()
      contact = newContact
    }

    // Create conversation entry
    const [conv] = await db.insert(conversations).values({
      org_id: org.id,
      contact_id: contact.id,
      last_message_at: new Date().toISOString(),
      last_message_preview: `Request: ${requestMessage.slice(0, 100)}`,
    }).returning()

    await db.insert(messages).values({
      org_id: org.id,
      conversation_id: conv.id,
      contact_id: contact.id,
      direction: 'inbound',
      content: `[Web Request] ${requestMessage}`,
      message_type: 'text',
    })

    // Create dashboard notification
    await db.insert(notifications).values({
      org_id: org.id,
      title: 'New Item Request',
      message: `${name || phoneClean} requested: ${requestMessage}`,
      type: 'info',
      action_url: `/dashboard/inbox?contact=${contact.id}`,
    })

    // If notification preference is WhatsApp, send message to merchant's phone
    if (org.notification_preference === 'whatsapp' && org.notification_phone && org.wa_phone_number_id && org.wa_access_token_encrypted) {
      try {
        const accessToken = decrypt(org.wa_access_token_encrypted)
        const waNumber = org.notification_phone.replace(/\D/g, '')
        await sendTextMessage(
          { phoneNumberId: org.wa_phone_number_id, accessToken },
          { to: waNumber, body: `   New Request from ${name || phoneClean}:\n\n"${requestMessage}"\n\nView in dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.com'}/dashboard/inbox` }
        )
      } catch (err) {
        console.error('[request] Failed to send WhatsApp notification:', err)
      }
    }

    // Build wa.me link
    const waPhone = (org.wa_bot_number || '').replace(/\D/g, '')
    const encodedMsg = encodeURIComponent(
      `Hi! I'm looking for something not listed on your store.\n\nRequest: ${requestMessage}${name ? `\n\n- ${name}` : ''}`
    )
    const whatsappLink = waPhone ? `https://wa.me/${waPhone}?text=${encodedMsg}` : ''

    return NextResponse.json({
      success: true,
      whatsappLink,
      message: 'Your request has been sent to the store owner.',
    })
  } catch (error: any) {
    console.error('Request error:', error)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}

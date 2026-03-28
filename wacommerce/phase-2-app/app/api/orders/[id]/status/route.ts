import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders, contacts, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: '✅ Your order has been confirmed!',
  processing: '⚙️ Your order is being processed.',
  shipped: '📦 Your order has shipped!',
  delivered: '🎉 Your order was delivered! Thank you for shopping with us.',
  cancelled: '❌ Your order has been cancelled. We apologize for any inconvenience.',
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, params.id), eq(orders.org_id, user.org_id)),
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const body = await req.json() as { status: string; tracking_number?: string }
  const { status, tracking_number } = body

  const update: Partial<typeof orders.$inferInsert> = {
    order_status: status,
    updated_at: new Date().toISOString(),
  }
  if (tracking_number) update.tracking_number = tracking_number

  const [updated] = await db.update(orders)
    .set(update)
    .where(and(eq(orders.id, params.id), eq(orders.org_id, user.org_id)))
    .returning()

  // Send WhatsApp notification to customer
  try {
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
    const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, order.contact_id) })

    if (org?.wa_phone_number_id && org?.wa_access_token_encrypted && contact?.phone) {
      const accessToken = decrypt(org.wa_access_token_encrypted)
      let message = STATUS_MESSAGES[status] || `Your order status has been updated to: ${status}`
      if (status === 'shipped' && tracking_number) {
        message += `\nTracking: ${tracking_number}`
      }
      message += `\nOrder: ${order.order_number}`

      await sendTextMessage(
        { phoneNumberId: org.wa_phone_number_id, accessToken },
        { to: contact.phone, body: message }
      )
    }
  } catch (err) {
    console.error('WhatsApp notification failed:', err)
  }

  return NextResponse.json({ data: updated, message: 'Order status updated' })
}

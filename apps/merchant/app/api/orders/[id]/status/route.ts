import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders, contacts, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'
import { logError, categorizeError } from '@/lib/error-logger'

const VALID_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const
type OrderStatus = typeof VALID_STATUSES[number]

const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
type PaymentStatus = typeof VALID_PAYMENT_STATUSES[number]

function isValidStatus(s: string): s is OrderStatus {
  return VALID_STATUSES.includes(s as OrderStatus)
}

function isValidPaymentStatus(s: string): s is PaymentStatus {
  return VALID_PAYMENT_STATUSES.includes(s as PaymentStatus)
}

// WhatsApp notification messages
const ORDER_MESSAGES: Record<string, { order: string; payment?: string }> = {
  'payment_paid': {
    order: 'Payment confirmed! Your order is being processed.',
  },
  confirmed: {
    order: 'Great news! Your order has been confirmed and will be prepared for you.',
  },
  processing: {
    order: 'Your order is now being prepared. We\'ll ship it soon!',
  },
  shipped: {
    order: 'Your order is on its way! 🚚 Track with your tracking number.',
  },
  delivered: {
    order: 'Your order has been delivered! 🎉 Thank you for shopping with us!',
  },
  cancelled: {
    order: 'Your order has been cancelled. Contact us if you need any help.',
  },
  refunded: {
    order: 'Your refund has been processed. The money will be returned to your account shortly.',
  },
}

async function notifyCustomerWhatsApp(orderId: string, message: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order) return

  const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, order.contact_id) })
  if (!contact?.phone) return

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, order.org_id) })
  if (!org?.wa_phone_number_id || !org?.wa_access_token_encrypted) return

  try {
    const accessToken = decrypt(org.wa_access_token_encrypted)
    await sendTextMessage(
      { phoneNumberId: org.wa_phone_number_id, accessToken },
      { to: contact.phone, body: `📦 *Order ${order.order_number}*\n\n${message}\n\nQuestions? Just message us!` }
    )
  } catch (err) {
    console.error('Failed to send WhatsApp notification:', err)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as {
    order_status?: string
    payment_status?: string
    tracking_number?: string
    notes?: string
    notify_customer?: boolean
  }
  const { order_status, payment_status, tracking_number, notes, notify_customer } = body

  if (!order_status && !payment_status && !tracking_number && !notes) {
    return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 })
  }

  if (order_status && !isValidStatus(order_status)) {
    return NextResponse.json({ error: `Invalid order_status. Valid: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  if (payment_status && !isValidPaymentStatus(payment_status)) {
    return NextResponse.json({ error: `Invalid payment_status. Valid: ${VALID_PAYMENT_STATUSES.join(', ')}` }, { status: 400 })
  }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, params.id), eq(orders.org_id, user.org_id)),
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const updatePayload: Record<string, string> = {
    updated_at: new Date().toISOString(),
  }
  if (order_status) updatePayload.order_status = order_status
  if (payment_status) updatePayload.payment_status = payment_status
  if (tracking_number) updatePayload.tracking_number = tracking_number
  if (notes) updatePayload.notes = notes

  await db.update(orders).set(updatePayload).where(and(eq(orders.id, params.id), eq(orders.org_id, user.org_id!)))

  // Send WhatsApp notification if requested
  if (notify_customer !== false) {
    try {
      let notificationMsg = ''

      if (payment_status === 'paid' && !order_status) {
        notificationMsg = ORDER_MESSAGES['payment_paid']?.order || 'Payment confirmed!'
      } else if (order_status) {
        notificationMsg = ORDER_MESSAGES[order_status]?.order || `Order status updated to ${order_status}`
      }

      if (notificationMsg) {
        await notifyCustomerWhatsApp(params.id, notificationMsg)
      }
    } catch (err) {
      console.error('Notification error:', err)
      // Don't fail the request if notification fails
    }
  }

  return NextResponse.json({ success: true, order_id: params.id, ...updatePayload })
}

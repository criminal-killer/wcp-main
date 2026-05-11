import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, contacts, organizations, conversations } from '@/lib/schema'
import { eq, and, lt, gte } from 'drizzle-orm'
import { getCartAbandoned, markCartReminderSent, clearCartAbandoned } from '@/lib/redis'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'

// This endpoint should be called by a cron job (e.g. every 15 minutes)
// Protect with a secret header: Authorization: Bearer CRON_SECRET
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find orders that were created ~1 hour ago with pending payment
  // and haven't received a reminder yet
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  const twentySevenHoursAgo = new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString()

  // 1st reminder: ~1 hour after order
  const pendingOrders = await db.select().from(orders)
    .where(and(
      eq(orders.payment_status, 'pending'),
      eq(orders.order_status, 'pending'),
      lt(orders.created_at, oneHourAgo),
      gte(orders.created_at, twoHoursAgo),
    ))

  // 2nd reminder: ~24 hours after order
  const oldPendingOrders = await db.select().from(orders)
    .where(and(
      eq(orders.payment_status, 'pending'),
      eq(orders.order_status, 'pending'),
      lt(orders.created_at, twentySixHoursAgo),
      gte(orders.created_at, twentySevenHoursAgo),
    ))

  // Collect unique org IDs
  const orgIdSet = new Set<string>()
  for (const o of [...pendingOrders, ...oldPendingOrders]) {
    orgIdSet.add(o.org_id)
  }
  const orgIds: string[] = []
  orgIdSet.forEach(id => orgIds.push(id))

  let remindersSent = 0

  for (const orgId of orgIds) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })
    if (!org) continue

    const accessToken = org.wa_access_token_encrypted
      ? decrypt(org.wa_access_token_encrypted)
      : null
    if (!accessToken || !org.wa_phone_number_id) continue

    const waConfig = { phoneNumberId: org.wa_phone_number_id, accessToken }

    // First reminder batch
    for (const order of pendingOrders.filter(o => o.org_id === orgId)) {
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, order.contact_id),
      })
      if (!contact) continue

      // Check if already reminded
      const abandoned = await getCartAbandoned(orgId, contact.phone)
      if (abandoned && abandoned.reminders >= 1) continue

      const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase()
      const total = order.total ? order.total.toLocaleString() : '0'
      const currency = order.currency || org.currency || 'USD'

      await sendTextMessage(waConfig, {
        to: contact.phone,
        body: `Hey! Just a quick reminder -- you left an order at *${org.name}*.\n\nOrder: *${orderNum}*\nTotal: *${currency} ${total}*\n\nReady to complete payment? Just reply *paid* once you've sent the money.`,
      })

      await markCartReminderSent(orgId, contact.phone)
      remindersSent++
    }

    // Second reminder batch
    for (const order of oldPendingOrders.filter(o => o.org_id === orgId)) {
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, order.contact_id),
      })
      if (!contact) continue

      const abandoned = await getCartAbandoned(orgId, contact.phone)
      if (abandoned && abandoned.reminders >= 2) continue

      const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase()
      const total = order.total ? order.total.toLocaleString() : '0'
      const currency = order.currency || org.currency || 'USD'

      await sendTextMessage(waConfig, {
        to: contact.phone,
        body: `Hi again! Just checking in -- your order at *${org.name}* is still waiting for payment.\n\n*${orderNum}* | *${currency} ${total}*\n\nIf you need help, just reply here or say *hi* to start fresh.`,
      })

      await markCartReminderSent(orgId, contact.phone)
      remindersSent++
    }
  }

  return NextResponse.json({
    success: true,
    reminders_sent: remindersSent,
    pending_1h: pendingOrders.length,
    pending_24h: oldPendingOrders.length,
  })
}

// Also expose a GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'abandoned-cart-reminders' })
}
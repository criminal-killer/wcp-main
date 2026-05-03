import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

const VALID_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const
type OrderStatus = typeof VALID_STATUSES[number]

function isValidStatus(s: string): s is OrderStatus {
  return VALID_STATUSES.includes(s as OrderStatus)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { order_status?: string; payment_status?: string; tracking_number?: string; notes?: string }
  const { order_status, payment_status, tracking_number, notes } = body

  if (!order_status && !payment_status && !tracking_number && !notes) {
    return NextResponse.json({ error: 'At least one field (order_status, payment_status, tracking_number, notes) is required.' }, { status: 400 })
  }

  if (order_status && !isValidStatus(order_status)) {
    return NextResponse.json({ error: `Invalid order_status. Valid values: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  // Ensure the order belongs to the user's org
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

  await db.update(orders).set(updatePayload).where(and(eq(orders.id, params.id), eq(orders.org_id, user.org_id)))

  return NextResponse.json({ success: true, order_id: params.id, ...updatePayload })
}

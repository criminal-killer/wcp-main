import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders, contacts } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let orderList = await db.select({
    id: orders.id, order_number: orders.order_number,
    items: orders.items, subtotal: orders.subtotal,
    delivery_fee: orders.delivery_fee, total: orders.total, currency: orders.currency,
    payment_method: orders.payment_method, payment_status: orders.payment_status,
    order_status: orders.order_status, tracking_number: orders.tracking_number,
    created_at: orders.created_at, updated_at: orders.updated_at,
    contact_name: contacts.name, contact_phone: contacts.phone, contact_id: orders.contact_id,
  })
    .from(orders)
    .leftJoin(contacts, eq(orders.contact_id, contacts.id))
    .where(
      and(
        eq(orders.org_id, user.org_id),
        status ? eq(orders.order_status, status) : undefined,
      )
    )
    .orderBy(desc(orders.created_at))
    .limit(200)

  if (search) {
    orderList = orderList.filter(o =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.contact_name?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return NextResponse.json({ data: orderList, total: orderList.length })
}

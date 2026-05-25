import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders, contacts } from '@/lib/schema'
import { eq, and, desc, like, or } from 'drizzle-orm'
import { logError, categorizeError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const conditions = [eq(orders.org_id, user.org_id)]
    if (status) conditions.push(eq(orders.order_status, status))
    if (search) {
      const pattern = `%${search}%`
      conditions.push(or(
        like(orders.order_number, pattern),
        like(contacts.name, pattern),
        like(contacts.phone, pattern)
      )!)
    }

    const orderList = await db.select({
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
      .where(and(...conditions))
      .orderBy(desc(orders.created_at))
      .limit(200)

    return NextResponse.json({ data: orderList, total: orderList.length })
  } catch (error) {
    console.error('[orders]', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

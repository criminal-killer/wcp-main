import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, organizations, contacts, users } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''
    const orgId = url.searchParams.get('org_id') || ''
    const status = url.searchParams.get('status') || ''
    const paymentStatus = url.searchParams.get('payment_status') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const orderList = await db.select({
      id: orders.id,
      org_id: orders.org_id,
      order_number: orders.order_number,
      total: orders.total,
      currency: orders.currency,
      order_status: orders.order_status,
      payment_status: orders.payment_status,
      payment_method: orders.payment_method,
      delivery_address: orders.delivery_address,
      items: orders.items,
      created_at: orders.created_at,
      org_name: organizations.name,
      contact_name: contacts.name,
      contact_phone: contacts.phone,
    })
      .from(orders)
      .leftJoin(organizations, eq(orders.org_id, organizations.id))
      .leftJoin(contacts, eq(orders.contact_id, contacts.id))
      .orderBy(desc(orders.created_at))
      .limit(limit)
      .offset(offset)

    let filtered = orderList
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        (o.contact_name || '').toLowerCase().includes(q) ||
        (o.contact_phone || '').toLowerCase().includes(q)
      )
    }
    if (orgId) {
      filtered = filtered.filter(o => o.org_id === orgId)
    }
    if (status) {
      filtered = filtered.filter(o => o.order_status === status)
    }
    if (paymentStatus) {
      filtered = filtered.filter(o => o.payment_status === paymentStatus)
    }

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('[admin/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      order_id: string
      order_status?: string
      payment_status?: string
    }

    if (!body.order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const validOrderStatuses = ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded']

    if (body.order_status) {
      if (!validOrderStatuses.includes(body.order_status)) {
        return NextResponse.json({ error: `Invalid order_status. Must be: ${validOrderStatuses.join(', ')}` }, { status: 400 })
      }
      update.order_status = body.order_status
    }
    if (body.payment_status) {
      if (!validPaymentStatuses.includes(body.payment_status)) {
        return NextResponse.json({ error: `Invalid payment_status. Must be: ${validPaymentStatuses.join(', ')}` }, { status: 400 })
      }
      update.payment_status = body.payment_status
    }

    await db.update(orders).set(update).where(eq(orders.id, body.order_id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

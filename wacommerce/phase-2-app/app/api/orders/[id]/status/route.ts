import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const { id } = params
    const body = await req.json()
    const { order_status, payment_status, notes } = body

    const update: any = {
      updated_at: sql`(datetime('now'))`,
    }

    if (order_status) update.order_status = order_status
    if (payment_status) update.payment_status = payment_status
    if (notes !== undefined) update.notes = notes

    await db.update(orders)
      .set(update)
      .where(and(eq(orders.id, id), eq(orders.org_id, user.org_id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ORDER_STATUS_PUT]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

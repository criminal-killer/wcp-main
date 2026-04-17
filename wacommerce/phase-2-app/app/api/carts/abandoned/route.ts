import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { carts, contacts, orders } from '@/lib/schema'
import { eq, and, lt, desc, notExists } from 'drizzle-orm'

export async function GET() {
  const { userId, orgId } = auth()
  if (!userId || !orgId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // An "Abandoned Cart" is a cart updated > 1 hour ago
    // that doesn't have a corresponding order created after the cart's last update
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const abandonedCarts = await db
      .select({
        cart: carts,
        contact: contacts,
      })
      .from(carts)
      .innerJoin(contacts, eq(carts.contact_id, contacts.id))
      .where(
        and(
          eq(carts.org_id, orgId),
          lt(carts.updated_at, oneHourAgo)
        )
      )
      .orderBy(desc(carts.updated_at))
      .limit(100)

    return NextResponse.json(abandonedCarts)
  } catch (error) {
    console.error('[ABANDONED_CARTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

/**
 * API Route: /api/stores/stats
 * Get stats for a specific store (real-time)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, stores, conversations, orders } from '@/lib/schema'
import { eq, and, sql, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storeId = req.nextUrl.searchParams.get('store_id')
  if (!storeId) {
    return NextResponse.json({ error: 'store_id is required' }, { status: 400 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerk_id, userId),
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify store belongs to user's org
  const store = await db.query.stores.findFirst({
    where: and(
      eq(stores.id, storeId),
      eq(stores.org_id, user.org_id!),
      eq(stores.is_active, 1)
    ),
  })
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  // Get unread messages count
  const unreadResult = await db.select({ count: count() })
    .from(conversations)
    .where(and(
      eq(conversations.store_id, storeId),
      eq(conversations.org_id, user.org_id!),
      eq(conversations.unread_count, 1)
    ))

  // Get pending orders count
  const pendingOrdersResult = await db.select({ count: count() })
    .from(orders)
    .where(and(
      eq(orders.store_id, storeId),
      eq(orders.org_id, user.org_id!),
      eq(orders.order_status, 'new')
    ))

  // Get this month's revenue (paid orders)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const revenueResult = await db.select({
    total: sql<number>`SUM(${orders.total})`
  })
    .from(orders)
    .where(and(
      eq(orders.store_id, storeId),
      eq(orders.org_id, user.org_id!),
      eq(orders.payment_status, 'paid'),
      sql`${orders.created_at} >= ${thirtyDaysAgo.toISOString()}`
    ))

  const stats = {
    unreadMessages: unreadResult[0]?.count || 0,
    pendingOrders: pendingOrdersResult[0]?.count || 0,
    revenue: revenueResult[0]?.total || 0,
  }

  return NextResponse.json({ stats, store })
}

/**
 * API Route: /api/stores/switch
 * Switch the active store for the current user
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, stores } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerk_id, userId),
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await req.json() as { store_id: string }
  if (!body.store_id) {
    return NextResponse.json({ error: 'store_id is required' }, { status: 400 })
  }

  // Verify store belongs to user's org
  const store = await db.query.stores.findFirst({
    where: and(
      eq(stores.id, body.store_id),
      eq(stores.org_id, user.org_id!),
      eq(stores.is_active, 1)
    ),
  })
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  // Update user's active store
  await db.update(users)
    .set({ active_store_id: store.id })
    .where(eq(users.id, user.id))

  return NextResponse.json({ success: true, active_store: store })
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications, users } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logError, categorizeError } from '@/lib/error-logger'

// GET - List notifications for user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const unreadCount = await db.select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.org_id, user.org_id!), eq(notifications.is_read, 0)))

    const whereClause = unreadOnly
      ? and(eq(notifications.org_id, user.org_id!), eq(notifications.is_read, 0))
      : eq(notifications.org_id, user.org_id!)

    const list = await db.select().from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.created_at))
      .limit(limit)

    return NextResponse.json({
      data: list,
      unread_count: unreadCount.length,
    })
  } catch (error) {
    console.error('[notifications]', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json() as { id?: string; mark_all_read?: boolean }

    if (body.mark_all_read) {
      await db.update(notifications)
        .set({ is_read: 1 })
        .where(and(eq(notifications.org_id, user.org_id!), eq(notifications.is_read, 0)))
    } else if (body.id) {
      await db.update(notifications)
        .set({ is_read: 1 })
        .where(and(eq(notifications.id, body.id), eq(notifications.org_id, user.org_id!)))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications]', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
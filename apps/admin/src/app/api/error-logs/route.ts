import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { errorLogs, users } from '@/lib/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'open'
  const orgId = url.searchParams.get('org_id')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = db.select().from(errorLogs)
  const conditions = []

  if (status !== 'all') conditions.push(eq(errorLogs.status, status))
  if (orgId) conditions.push(eq(errorLogs.org_id, orgId))

  if (conditions.length > 0) {
    const { and } = await import('drizzle-orm')
    query = (query as any).where(and(...conditions))
  }

  const logs = await (query as any).orderBy(
    sql`CASE WHEN severity = 'high' THEN 0 ELSE 1 END`,
    desc(errorLogs.created_at)
  ).limit(limit).offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(errorLogs)
  const [{ open_count }] = await db.select({ open_count: sql<number>`count(*)` }).from(errorLogs).where(eq(errorLogs.status, 'open'))

  return NextResponse.json({ data: logs, total: count, open: open_count })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { id: string; status: string }
  if (!body.id || !['open', 'investigating', 'fixed'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await db.update(errorLogs).set({
    status: body.status,
    updated_at: new Date().toISOString(),
  }).where(eq(errorLogs.id, body.id))

  return NextResponse.json({ success: true })
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, conversations, contacts } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const list = await db.select({
    id: conversations.id, status: conversations.status,
    is_bot_active: conversations.is_bot_active,
    last_message_at: conversations.last_message_at,
    last_message_preview: conversations.last_message_preview,
    unread_count: conversations.unread_count,
    contact_name: contacts.name, contact_phone: contacts.phone, contact_id: conversations.contact_id,
  })
    .from(conversations)
    .leftJoin(contacts, eq(conversations.contact_id, contacts.id))
    .where(
      and(
        eq(conversations.org_id, user.org_id),
        status ? eq(conversations.status, status) : undefined,
      )
    )
    .orderBy(desc(conversations.last_message_at))
    .limit(50)

  return NextResponse.json({ data: list, total: list.length })
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { id: string; is_bot_active?: boolean; status?: string }
  const update: Partial<typeof conversations.$inferInsert> = {}
  if (body.is_bot_active !== undefined) update.is_bot_active = body.is_bot_active ? 1 : 0
  if (body.status) update.status = body.status

  await db.update(conversations).set(update).where(
    and(eq(conversations.id, body.id), eq(conversations.org_id, user.org_id))
  )
  return NextResponse.json({ message: 'Conversation updated' })
}

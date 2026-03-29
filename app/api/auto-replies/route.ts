import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, auto_replies } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const list = await db.select().from(auto_replies).where(eq(auto_replies.org_id, user.org_id))
  return NextResponse.json({ data: list })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { type: string; keyword?: string; question?: string; response: string }

  if (!body.response || !body.type) {
    return NextResponse.json({ error: 'type and response are required' }, { status: 400 })
  }

  const [reply] = await db.insert(auto_replies).values({
    org_id: user.org_id,
    type: body.type,
    keyword: body.keyword,
    question: body.question,
    response: body.response,
    is_active: 1,
  }).returning()

  return NextResponse.json({ data: reply, message: 'Auto-reply created' }, { status: 201 })
}

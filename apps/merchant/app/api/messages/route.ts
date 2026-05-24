import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, messages } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversation_id')
    if (!conversationId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    const msgList = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.conversation_id, conversationId),
          eq(messages.org_id, user.org_id),
        )
      )
      .orderBy(messages.created_at)
      .limit(limit)
      .offset(offset)
    return NextResponse.json({ data: msgList })
  } catch (error) {
    console.error('[messages]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

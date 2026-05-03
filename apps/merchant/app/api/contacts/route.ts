import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, contacts } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const tag = searchParams.get('tag')

  let list = await db.select()
    .from(contacts)
    .where(eq(contacts.org_id, user.org_id))
    .orderBy(desc(contacts.created_at))
    .limit(1000)

  if (search) {
    list = list.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
  }
  if (tag) {
    list = list.filter(c => {
      const tags = JSON.parse(c.tags || '[]') as string[]
      return tags.includes(tag)
    })
  }

  return NextResponse.json({ data: list, total: list.length })
}

export async function GET_EXPORT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const list = await db.select()
    .from(contacts)
    .where(eq(contacts.org_id, user.org_id))
    .orderBy(desc(contacts.created_at))

  const csv = [
    'Name,Phone,Email,Total Orders,Total Spent,Tags,Created At',
    ...list.map(c => [
      c.name || '',
      c.phone,
      c.email || '',
      c.total_orders || 0,
      c.total_spent || 0,
      JSON.parse(c.tags || '[]').join(';'),
      c.created_at || '',
    ].join(',')),
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="contacts.csv"',
    },
  })
}

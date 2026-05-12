import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, contacts } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getActiveStore } from '@/lib/store-context'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const tag = searchParams.get('tag')
  const storeId = searchParams.get('store_id')

  // Get active store if no specific store_id provided
  const activeStore = storeId ? null : await getActiveStore(userId)
  const targetStoreId = storeId || activeStore?.id

  let list = await db.select()
    .from(contacts)
    .where(
      and(
        eq(contacts.org_id, user.org_id!),
        targetStoreId ? eq(contacts.store_id, targetStoreId) : undefined,
      )
    )
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

  return NextResponse.json({ data: list, total: list.length, store_id: targetStoreId })
}

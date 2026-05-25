import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stores, organizations, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const orgId = url.searchParams.get('org_id') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)

    const storeList = await db.select({
      id: stores.id,
      org_id: stores.org_id,
      name: stores.name,
      slug: stores.slug,
      store_type: stores.store_type,
      currency: stores.currency,
      is_active: stores.is_active,
      is_default: stores.is_default,
      created_at: stores.created_at,
      org_name: organizations.name,
    })
      .from(stores)
      .leftJoin(organizations, eq(stores.org_id, organizations.id))
      .orderBy(desc(stores.created_at))
      .limit(limit)

    const filtered = orgId ? storeList.filter(s => s.org_id === orgId) : storeList

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('[admin/stores]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { store_id: string; action: 'activate' | 'deactivate' }
    if (!body.store_id) return NextResponse.json({ error: 'store_id required' }, { status: 400 })

    await db.update(stores).set({
      is_active: body.action === 'activate' ? 1 : 0,
      updated_at: new Date().toISOString(),
    }).where(eq(stores.id, body.store_id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/stores]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

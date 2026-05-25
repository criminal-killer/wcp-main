import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, organizations, users } from '@/lib/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''
    const orgId = url.searchParams.get('org_id') || ''
    const category = url.searchParams.get('category') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const prods = await db.select({
      id: products.id,
      org_id: products.org_id,
      name: products.name,
      description: products.description,
      price: products.price,
      currency: products.currency,
      category: products.category,
      product_type: products.product_type,
      inventory_count: products.inventory_count,
      is_active: products.is_active,
      created_at: products.created_at,
      org_name: organizations.name,
    })
      .from(products)
      .leftJoin(organizations, eq(products.org_id, organizations.id))
      .orderBy(desc(products.created_at))
      .limit(limit)
      .offset(offset)

    let filtered = prods
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }
    if (orgId) {
      filtered = filtered.filter(p => p.org_id === orgId)
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category)
    }

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('[admin/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { product_id: string; action: 'activate' | 'deactivate' }
    if (!body.product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

    await db.update(products).set({
      is_active: body.action === 'activate' ? 1 : 0,
      updated_at: new Date().toISOString(),
    }).where(eq(products.id, body.product_id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

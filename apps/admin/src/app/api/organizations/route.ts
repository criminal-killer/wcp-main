import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, users, products, orders, subscriptions, errorLogs } from '@/lib/schema'
import { eq, desc, and, sql, count } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''
    const plan = url.searchParams.get('plan') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const orgs = await db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      country: organizations.country,
      currency: organizations.currency,
      is_active: organizations.is_active,
      wa_phone_number_id: organizations.wa_phone_number_id,
      created_at: organizations.created_at,
    })
      .from(organizations)
      .orderBy(desc(organizations.created_at))
      .limit(limit)
      .offset(offset)

    // Get stats for each org
    const orgsWithStats = await Promise.all(orgs.map(async (org) => {
      const [productCount] = await db.select({ value: count() }).from(products).where(eq(products.org_id, org.id))
      const [orderCount] = await db.select({ value: count() }).from(orders).where(eq(orders.org_id, org.id))
      const [errorCount] = await db.select({ value: count() }).from(errorLogs)
        .where(and(eq(errorLogs.org_id, org.id), eq(errorLogs.status, 'open')))
      const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.org_id, org.id) })
      return {
        ...org,
        product_count: productCount.value,
        order_count: orderCount.value,
        open_errors: errorCount.value,
        subscription_plan: sub?.plan || null,
      }
    }))

    let filtered = orgsWithStats
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q) ||
        (o.country || '').toLowerCase().includes(q)
      )
    }
    if (plan) {
      filtered = filtered.filter(o => (o.plan || 'trial') === plan)
    }

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('[admin/organizations]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      org_id: string
      action: 'suspend' | 'activate' | 'change_plan' | 'update'
      plan?: string
      name?: string
      description?: string
    }

    if (!body.org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.action === 'suspend') {
      update.is_active = 0
    } else if (body.action === 'activate') {
      update.is_active = 1
    } else if (body.action === 'change_plan' && body.plan) {
      const validPlans = ['trial', 'starter', 'pro', 'elite']
      if (!validPlans.includes(body.plan)) {
        return NextResponse.json({ error: `Invalid plan. Must be: ${validPlans.join(', ')}` }, { status: 400 })
      }
      update.plan = body.plan
    } else if (body.action === 'update') {
      if (body.name) update.name = body.name
      if (body.description !== undefined) update.description = body.description
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await db.update(organizations).set(update).where(eq(organizations.id, body.org_id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/organizations]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

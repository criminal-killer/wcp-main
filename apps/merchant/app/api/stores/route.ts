import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { stores, organizations, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { PLAN_CONFIG, normalizePlan } from '@/lib/payments'

// GET - List all stores for the user's org
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const storeList = await db.select().from(stores)
      .where(and(eq(stores.org_id, user.org_id!), eq(stores.is_active, 1)))
      .orderBy(stores.created_at)

    return NextResponse.json({ data: storeList })
  } catch (error) {
    console.error('[stores]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new store
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id!) })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Check store limit based on plan
    const plan = normalizePlan(org.plan || 'starter')
    const limit = PLAN_CONFIG[plan].store_limit

    const existingStores = await db.select({ id: stores.id }).from(stores)
      .where(and(eq(stores.org_id, user.org_id!), eq(stores.is_active, 1)))

    if (existingStores.length >= limit) {
      return NextResponse.json({
        error: `Your ${PLAN_CONFIG[plan].name} plan allows up to ${limit} stores. Upgrade to create more.`,
      }, { status: 403 })
    }

    const body = await req.json() as {
      name: string
      store_type?: 'physical' | 'digital' | 'services'
      description?: string
      currency?: string
      delivery_fee?: number
      default_categories?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
    }

    // Generate slug from name
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
      '-' + Date.now().toString(36)

    const [store] = await db.insert(stores).values({
      org_id: user.org_id,
      name: body.name.trim(),
      slug,
      store_type: body.store_type || 'physical',
      description: body.description,
      currency: body.currency || 'USD',
      delivery_fee: body.delivery_fee || 0,
      is_default: 0,
      default_categories: body.default_categories || '[]',
    }).returning()

    return NextResponse.json({ data: store })
  } catch (error) {
    console.error('[stores]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update store
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json() as {
      store_id: string
      name?: string
      description?: string
      currency?: string
      delivery_fee?: number
      theme_color?: string
      is_default?: boolean
      default_categories?: string
    }

    if (!body.store_id) {
      return NextResponse.json({ error: 'store_id is required' }, { status: 400 })
    }

    // Verify store belongs to user's org
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, body.store_id), eq(stores.org_id, user.org_id)),
    })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description
    if (body.currency) updateData.currency = body.currency
    if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee
    if (body.theme_color) updateData.theme_color = body.theme_color
    if (body.default_categories !== undefined) updateData.default_categories = body.default_categories

    // If setting as default, unset other defaults first
    if (body.is_default) {
      await db.update(stores).set({ is_default: 0 })
        .where(and(eq(stores.org_id, user.org_id!), eq(stores.is_default, 1)))
      updateData.is_default = 1
    }

    await db.update(stores).set(updateData).where(eq(stores.id, body.store_id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[stores]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, subscriptions } from '@/lib/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const search = url.searchParams.get('search') || ''
    const plan = url.searchParams.get('plan') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      clerk_id: users.clerk_id,
      created_at: users.created_at,
      is_active: users.is_active,
      org_id: users.org_id,
      org_name: organizations.name,
      org_plan: organizations.plan,
      org_country: organizations.country,
      org_is_active: organizations.is_active,
      plan: subscriptions.plan,
    })
      .from(users)
      .leftJoin(organizations, eq(users.org_id, organizations.id))
      .leftJoin(subscriptions, eq(users.org_id, subscriptions.org_id))
      .orderBy(desc(users.created_at))
      .limit(limit)
      .offset(offset)

    let filtered = allUsers
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.org_name || '').toLowerCase().includes(q)
      )
    }
    if (plan) {
      filtered = filtered.filter(u => (u.plan || 'trial') === plan)
    }

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('[admin/users]', error)
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
      user_id?: string
      org_id?: string
      action: 'suspend' | 'activate' | 'change_plan'
      plan?: string
    }

    if (!body.action) return NextResponse.json({ error: 'action required' }, { status: 400 })

    if (body.action === 'suspend' && body.org_id) {
      await db.update(organizations).set({ is_active: 0, updated_at: new Date().toISOString() }).where(eq(organizations.id, body.org_id))
      return NextResponse.json({ success: true, message: 'Organization suspended' })
    }

    if (body.action === 'activate' && body.org_id) {
      await db.update(organizations).set({ is_active: 1, updated_at: new Date().toISOString() }).where(eq(organizations.id, body.org_id))
      return NextResponse.json({ success: true, message: 'Organization activated' })
    }

    if (body.action === 'change_plan' && body.org_id && body.plan) {
      const validPlans = ['trial', 'starter', 'pro', 'elite']
      if (!validPlans.includes(body.plan)) {
        return NextResponse.json({ error: `Invalid plan. Must be: ${validPlans.join(', ')}` }, { status: 400 })
      }
      await db.update(organizations).set({ plan: body.plan, updated_at: new Date().toISOString() }).where(eq(organizations.id, body.org_id))
      // Also update subscription if exists
      if (body.plan !== 'trial') {
        await db.update(subscriptions).set({ plan: body.plan, updated_at: new Date().toISOString() }).where(eq(subscriptions.org_id, body.org_id))
      }
      return NextResponse.json({ success: true, message: `Plan changed to ${body.plan}` })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[admin/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

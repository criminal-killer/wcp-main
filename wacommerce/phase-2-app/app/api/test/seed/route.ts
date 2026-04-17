import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // 1. Starter Test Org
    const starterId = 'test_org_starter'
    await db.insert(organizations).values({
      id: starterId,
      name: 'Starter Shop',
      slug: 'starter-shop',
      plan: 'starter',
      trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Ends tomorrow
    }).onConflictDoUpdate({
      target: organizations.id,
      set: { plan: 'starter', name: 'Starter Shop' }
    })

    await db.insert(users).values({
      clerk_id: 'user_starter_test',
      org_id: starterId,
      email: 'starter@test.com',
      name: 'Starter Owner',
      role: 'owner'
    }).onConflictDoNothing()

    // 2. Growth Test Org
    const growthId = 'test_org_growth'
    await db.insert(organizations).values({
      id: growthId,
      name: 'Growth Mart',
      slug: 'growth-mart',
      plan: 'growth',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).onConflictDoUpdate({
      target: organizations.id,
      set: { plan: 'growth', name: 'Growth Mart' }
    })

    await db.insert(users).values({
      clerk_id: 'user_growth_test',
      org_id: growthId,
      email: 'growth@test.com',
      name: 'Growth Owner',
      role: 'owner'
    }).onConflictDoNothing()

    // 3. Elite Test Org
    const eliteId = 'test_org_elite'
    await db.insert(organizations).values({
      id: eliteId,
      name: 'Elite Enterprise',
      slug: 'elite-ent',
      plan: 'elite',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).onConflictDoUpdate({
      target: organizations.id,
      set: { plan: 'elite', name: 'Elite Enterprise' }
    })

    await db.insert(users).values({
      clerk_id: 'user_elite_test',
      org_id: eliteId,
      email: 'elite@test.com',
      name: 'Elite Owner',
      role: 'owner'
    }).onConflictDoNothing()

    return NextResponse.json({ success: true, message: 'Seeded Starter, Growth, and Elite test users.' })
  } catch (error) {
    console.error('[SEED_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { clearProductCache } from '@/lib/redis'

const PLAN_LIMITS = { 
  trial: 100, 
  free: 10, 
  starter: 100, 
  pro: 500, 
  elite: 5000,
  custom: 10000 
}
const CATEGORY_LIMITS = { 
  trial: 20, 
  free: 5, 
  starter: 20, 
  pro: 50, 
  elite: 100,
  custom: 200 
}

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional(),
  category: z.string().min(1).max(100).default('General'),
  images: z.array(z.string().url()).max(5).default([]),
  variants: z.array(z.object({ type: z.string(), options: z.array(z.string()) })).default([]),
  inventory_count: z.number().int().min(0).default(0),
})

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const productList = await db.select().from(products).where(
    and(
      eq(products.org_id, user.org_id),
      category ? eq(products.category, category) : undefined,
    )
  )

  const filtered = search
    ? productList.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : productList

  return NextResponse.json({ data: filtered, total: filtered.length })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  // Check plan limits
  const existing = await db.select().from(products).where(eq(products.org_id, user.org_id))
  const plan = (org.plan || 'free') as keyof typeof PLAN_LIMITS
  const limit = PLAN_LIMITS[plan] || 10

  if (existing.length >= limit) {
    return NextResponse.json({
      error: `Product limit reached (${limit}). Upgrade your plan to add more products.`,
      code: 'PLAN_LIMIT',
    }, { status: 403 })
  }

  const body = await req.json() as Record<string, unknown>
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const data = parsed.data
  const [product] = await db.insert(products).values({
    org_id: user.org_id,
    name: data.name,
    description: data.description,
    price: data.price,
    compare_at_price: data.compare_at_price,
    category: data.category,
    images: JSON.stringify(data.images),
    variants: JSON.stringify(data.variants),
    inventory_count: data.inventory_count,
    currency: org.currency || 'KES',
    is_active: 1,
  }).returning()

  await clearProductCache(user.org_id)
  return NextResponse.json({ data: product, message: 'Product created' }, { status: 201 })
}

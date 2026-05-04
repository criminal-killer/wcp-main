import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

// ============================================
// GET /api/products/[id] — Get a single product
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, params.id), eq(products.org_id, user.org_id)),
  })

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  return NextResponse.json({ data: product })
}

// ============================================
// PUT /api/products/[id] — Update a product
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await db.query.products.findFirst({
    where: and(eq(products.id, params.id), eq(products.org_id, user.org_id)),
  })
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const body = await req.json() as {
    name?: string
    description?: string
    price?: number
    compare_at_price?: number
    category?: string
    images?: string[]
    variants?: unknown[]
    inventory_count?: number
    is_active?: boolean
    sort_order?: number
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (body.name !== undefined) updatePayload.name = body.name.trim()
  if (body.description !== undefined) updatePayload.description = body.description
  if (body.price !== undefined) updatePayload.price = body.price
  if (body.compare_at_price !== undefined) updatePayload.compare_at_price = body.compare_at_price
  if (body.category !== undefined) updatePayload.category = body.category
  if (body.images !== undefined) updatePayload.images = JSON.stringify(body.images)
  if (body.variants !== undefined) updatePayload.variants = JSON.stringify(body.variants)
  if (body.inventory_count !== undefined) updatePayload.inventory_count = body.inventory_count
  if (body.is_active !== undefined) updatePayload.is_active = body.is_active ? 1 : 0
  if (body.sort_order !== undefined) updatePayload.sort_order = body.sort_order

  await db.update(products).set(updatePayload).where(and(eq(products.id, params.id), eq(products.org_id, user.org_id)))

  return NextResponse.json({ success: true, product_id: params.id })
}

// ============================================
// DELETE /api/products/[id] — Delete a product
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await db.query.products.findFirst({
    where: and(eq(products.id, params.id), eq(products.org_id, user.org_id)),
  })
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  await db.delete(products).where(and(eq(products.id, params.id), eq(products.org_id, user.org_id)))

  return NextResponse.json({ success: true, message: 'Product deleted.' })
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { clearProductCache } from '@/lib/redis'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, params.id), eq(products.org_id, user.org_id)),
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const body = await req.json() as Record<string, unknown>
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description
  if (body.price) updateData.price = body.price
  if (body.compare_at_price !== undefined) updateData.compare_at_price = body.compare_at_price
  if (body.category) updateData.category = body.category
  if (body.images) updateData.images = JSON.stringify(body.images)
  if (body.variants) updateData.variants = JSON.stringify(body.variants)
  if (body.inventory_count !== undefined) updateData.inventory_count = body.inventory_count
  if (body.is_active !== undefined) updateData.is_active = body.is_active ? 1 : 0

  const [updated] = await db.update(products)
    .set(updateData as Partial<typeof products.$inferInsert>)
    .where(and(eq(products.id, params.id), eq(products.org_id, user.org_id)))
    .returning()

  await clearProductCache(user.org_id)
  return NextResponse.json({ data: updated, message: 'Product updated' })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await db.update(products)
    .set({ is_active: 0 })
    .where(and(eq(products.id, params.id), eq(products.org_id, user.org_id)))

  await clearProductCache(user.org_id)
  return NextResponse.json({ message: 'Product deleted' })
}

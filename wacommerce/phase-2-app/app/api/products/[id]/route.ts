import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { clearProductCache } from '@/lib/redis'

const productUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  compare_at_price: z.number().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  images: z.array(z.string().url()).max(5).optional(),
  variants: z.array(z.object({ type: z.string(), options: z.array(z.string()) })).optional(),
  inventory_count: z.number().int().min(0).optional(),
  type: z.enum(['physical', 'digital', 'service']).optional(),
  digital_content: z.string().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, params.id),
      eq(products.org_id, user.org_id)
    )
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ data: product })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updateData: any = { ...parsed.data }
  if (updateData.images) updateData.images = JSON.stringify(updateData.images)
  if (updateData.variants) updateData.variants = JSON.stringify(updateData.variants)

  const [updatedProduct] = await db.update(products)
    .set({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .where(and(
      eq(products.id, params.id),
      eq(products.org_id, user.org_id)
    ))
    .returning()

  if (!updatedProduct) {
    return NextResponse.json({ error: 'Product not found or not updated' }, { status: 404 })
  }

  await clearProductCache(user.org_id)
  return NextResponse.json({ data: updatedProduct, message: 'Product updated successfully' })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Soft delete by setting is_active to 0
  const [deletedProduct] = await db.update(products)
    .set({ is_active: 0, updated_at: new Date().toISOString() })
    .where(and(
      eq(products.id, params.id),
      eq(products.org_id, user.org_id)
    ))
    .returning()

  if (!deletedProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await clearProductCache(user.org_id)
  return NextResponse.json({ message: 'Product deleted successfully' })
}

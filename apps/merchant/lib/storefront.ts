import { db } from '@/lib/db'
import { organizations, products } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

export type StoreOrg = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  theme_color: string | null
  currency: string | null
  delivery_fee: number | null
  free_delivery_above: number | null
  wa_phone_number_id: string | null
  wa_bot_number: string | null
}

export type StoreProduct = {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  currency: string | null
  category: string | null
  sub_category: string | null
  product_type: string | null
  images: string
  variants: string
  inventory_count: number | null
  service_duration: string | null
}

export async function getStoreBySlug(slug: string): Promise<StoreOrg | null> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo_url: true,
      theme_color: true,
      currency: true,
      delivery_fee: true,
      free_delivery_above: true,
      wa_phone_number_id: true,
      wa_bot_number: true,
    },
  })
  return org as StoreOrg | null
}

export async function getStoreProducts(orgId: string, options?: {
  category?: string
  search?: string
  limit?: number
}): Promise<StoreProduct[]> {
  const conditions = [eq(products.org_id, orgId), eq(products.is_active, 1)]
  if (options?.category) conditions.push(eq(products.category, options.category))
  if (options?.search) conditions.push(sql`${products.name} LIKE ${'%' + options.search + '%'}`)

  const results = await db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    price: products.price,
    compare_at_price: products.compare_at_price,
    currency: products.currency,
    category: products.category,
    sub_category: products.sub_category,
    product_type: products.product_type,
    images: products.images,
    variants: products.variants,
    inventory_count: products.inventory_count,
    service_duration: products.service_duration,
  }).from(products).where(and(...conditions)).limit(options?.limit || 50)

  return results as StoreProduct[]
}

export async function getStoreProductById(orgId: string, productId: string): Promise<StoreProduct | null> {
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.org_id, orgId), eq(products.is_active, 1)),
    columns: {
      id: true,
      name: true,
      description: true,
      price: true,
      compare_at_price: true,
      currency: true,
      category: true,
      sub_category: true,
      product_type: true,
      images: true,
      variants: true,
      inventory_count: true,
      service_duration: true,
    },
  })
  return product as StoreProduct | null
}

export async function getStoreCategories(orgId: string): Promise<string[]> {
  const rows = await db.select({ category: products.category })
    .from(products)
    .where(and(eq(products.org_id, orgId), eq(products.is_active, 1)))
  return Array.from(new Set(rows.map(r => r.category).filter(Boolean))) as string[]
}

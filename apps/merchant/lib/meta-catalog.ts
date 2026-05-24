import { db } from '@/lib/db'
import { organizations, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { decrypt } from '@/lib/encryption'

const DEFAULT_CATEGORY_MAP: Record<string, string> = {
  'Services': '5031',
  'Digital': '5031',
  'Furniture': '436',
  'Electronics': '222',
  'Clothing': '212',
  'Shoes': '187',
  'Food': '211',
  'Health': '5301',
  'Beauty': '5301',
  'Books': '222',
  'Accessories': '6700',
}

function getCategoryMap(org: typeof organizations.$inferSelect): Record<string, string> {
  try {
    const custom = JSON.parse(org.category_mapping || '{}')
    return { ...DEFAULT_CATEGORY_MAP, ...custom }
  } catch {
    return DEFAULT_CATEGORY_MAP
  }
}

function mapGoogleCategory(category: string | null, org: typeof organizations.$inferSelect): string {
  const map = getCategoryMap(org)
  return map[category || ''] || '603'
}

export async function syncProductToCatalog(
  orgId: string,
  product: typeof products.$inferSelect,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<{ success: boolean; error?: string }> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  })
  if (!org || !org.wa_catalog_id || !org.meta_business_id || !org.wa_access_token_encrypted) {
    return { success: false, error: 'Catalog not configured' }
  }

  const accessToken = decrypt(org.wa_access_token_encrypted)
  const catalogId = org.wa_catalog_id
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${org.slug}.chatevo.com`
  const category = product.category || 'General'
  const images = JSON.parse(product.images || '[]') as string[]

  const payload: {
    method: 'CREATE' | 'UPDATE' | 'DELETE'
    data: Record<string, string>
  } = {
    method: action === 'DELETE' ? 'DELETE' : (action === 'CREATE' ? 'CREATE' : 'UPDATE'),
    data: {
      id: product.id,
    },
  }

  if (action !== 'DELETE') {
    payload.data = {
      id: product.id,
      title: product.name,
      description: product.description || '',
      price: `${product.price} ${org.currency || 'KES'}`,
      image_link: images[0] || '',
      link: `${baseUrl}/store/${org.slug}/product/${product.id}`,
      availability: product.inventory_count && product.inventory_count > 0 ? 'in stock' : 'out of stock',
      brand: org.name,
      condition: 'new',
      google_product_category: mapGoogleCategory(product.category, org),
      quantity_to_sell_on_facebook: String(product.inventory_count || 0),
    }
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${catalogId}/items_batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: accessToken,
        item_type: 'PRODUCT_ITEM',
        requests: JSON.stringify([payload]),
      }),
    })
    const data = await res.json()
    if (data.handles) {
      return { success: true }
    }
    return { success: false, error: JSON.stringify(data.error || data) }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function syncAllProductsToCatalog(
  orgId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  })
  if (!org || !org.wa_catalog_id || !org.wa_access_token_encrypted) {
    return { success: false, count: 0, errors: ['Catalog not configured'] }
  }

  const productList = await db.select().from(products).where(
    and(eq(products.org_id, orgId))
  )

  const accessToken = decrypt(org.wa_access_token_encrypted)
  const catalogId = org.wa_catalog_id
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${org.slug}.chatevo.com`

  const requests = productList.map(product => {
    const images = JSON.parse(product.images || '[]') as string[]
    const category = product.category || 'General'
    return {
      method: 'CREATE',
      data: {
        id: product.id,
        title: product.name,
        description: product.description || '',
        price: `${product.price} ${org.currency || 'KES'}`,
        image_link: images[0] || '',
        link: `${baseUrl}/store/${org.slug}/product/${product.id}`,
        availability: product.inventory_count && product.inventory_count > 0 ? 'in stock' : 'out of stock',
        brand: org.name,
        condition: 'new',
        google_product_category: mapGoogleCategory(category, org),
        quantity_to_sell_on_facebook: String(product.inventory_count || 0),
      },
    }
  })

  if (requests.length === 0) return { success: true, count: 0, errors: [] }

  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${catalogId}/items_batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: accessToken,
        item_type: 'PRODUCT_ITEM',
        requests: JSON.stringify(requests),
      }),
    })
    const result = await res.json()
    if (result.handles) {
      return { success: true, count: productList.length, errors: [] }
    }
    return { success: false, count: 0, errors: [JSON.stringify(result.error || result)] }
  } catch (err) {
    return { success: false, count: 0, errors: [String(err)] }
  }
}

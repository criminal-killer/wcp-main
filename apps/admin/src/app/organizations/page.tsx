import { db } from '@/lib/db'
import { organizations, subscriptions, products, orders, errorLogs } from '@/lib/schema'
import { eq, desc, and, count, sql } from 'drizzle-orm'
import OrganizationsClient from './organizations-client'

export const dynamic = 'force-dynamic'

export default async function OrganizationsPage() {
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
  }).from(organizations).orderBy(desc(organizations.created_at)).limit(500)

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

  return <OrganizationsClient initialData={orgsWithStats} />
}

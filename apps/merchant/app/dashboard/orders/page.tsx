import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, orders, contacts, organizations } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import OrdersTable from './orders-table'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })

  const orderList = await db.select({
    id: orders.id, order_number: orders.order_number,
    total: orders.total, currency: orders.currency,
    payment_status: orders.payment_status, order_status: orders.order_status,
    payment_method: orders.payment_method, created_at: orders.created_at,
    contact_name: contacts.name, contact_phone: contacts.phone,
  })
    .from(orders)
    .leftJoin(contacts, eq(orders.contact_id, contacts.id))
    .where(eq(orders.org_id, user.org_id))
    .orderBy(desc(orders.created_at))
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">{orderList.length} orders · 300/month limit</p>
        </div>
      </div>

      {orderList.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-bold text-muted-foreground text-lg mb-2">No orders yet</h3>
          <p className="text-muted-foreground/70 mb-6">Orders will appear here when customers buy through your WhatsApp store.</p>
          <Link href="/dashboard/settings?tab=whatsapp" className="bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
            Connect WhatsApp →
          </Link>
        </div>
      ) : (
        <OrdersTable orders={orderList} currency={org?.currency || 'USD'} />
      )}
    </div>
  )
}

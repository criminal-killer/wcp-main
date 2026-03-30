import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, orders, contacts, organizations } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-cyan-100 text-cyan-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
}
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-secondary/50 text-muted-foreground',
}

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
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by order # or customer..."
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            {['new', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button key={status} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-[#25D366] hover:text-[#25D366] transition-colors capitalize">
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Payment</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orderList.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-foreground text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground/70">{order.payment_method || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground text-sm">{order.contact_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground/70">{order.contact_phone}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-foreground text-sm">
                      {org?.currency} {order.total.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_COLORS[order.payment_status || 'pending']}`}>
                        {order.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.order_status || 'new']}`}>
                        {order.order_status || 'new'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {new Date(order.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-sm text-[#25D366] font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

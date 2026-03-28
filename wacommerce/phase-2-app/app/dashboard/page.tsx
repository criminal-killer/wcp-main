import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { db } from '@/lib/db'
import { users, organizations, orders, contacts, products } from '@/lib/schema'
import { eq, and, gte, desc, sql, count, sum } from 'drizzle-orm'
import { TrendingUp, ShoppingCart, Users, Package, Store, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) redirect('/onboarding')

    const orgId = user.org_id
    const today = new Date(); today.setHours(0,0,0,0)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(); monthAgo.setDate(1)

    // Metrics queries
    const [
      todayOrders, weekOrders, monthOrders, allOrders,
      todayRevenue, monthRevenue, allRevenue,
      contactCount, productCount,
      recentOrders, topProducts,
    ] = await Promise.all([
      db.select({ count: count() }).from(orders).where(and(eq(orders.org_id, orgId), gte(orders.created_at, today.toISOString()))),
      db.select({ count: count() }).from(orders).where(and(eq(orders.org_id, orgId), gte(orders.created_at, weekAgo.toISOString()))),
      db.select({ count: count() }).from(orders).where(and(eq(orders.org_id, orgId), gte(orders.created_at, monthAgo.toISOString()))),
      db.select({ count: count() }).from(orders).where(eq(orders.org_id, orgId)),
      db.select({ total: sum(orders.total) }).from(orders).where(and(eq(orders.org_id, orgId), eq(orders.payment_status, 'paid'), gte(orders.created_at, today.toISOString()))),
      db.select({ total: sum(orders.total) }).from(orders).where(and(eq(orders.org_id, orgId), eq(orders.payment_status, 'paid'), gte(orders.created_at, monthAgo.toISOString()))),
      db.select({ total: sum(orders.total) }).from(orders).where(and(eq(orders.org_id, orgId), eq(orders.payment_status, 'paid'))),
      db.select({ count: count() }).from(contacts).where(eq(contacts.org_id, orgId)),
      db.select({ count: count() }).from(products).where(and(eq(products.org_id, orgId), eq(products.is_active, 1))),
      db.select().from(orders).where(eq(orders.org_id, orgId)).orderBy(desc(orders.created_at)).limit(5),
      db.select({ name: products.name, count: count(orders.id) })
        .from(orders)
        .innerJoin(products, sql`json_extract(${orders.items}, '$[0].product_id') = ${products.id}`)
        .where(eq(orders.org_id, orgId))
        .groupBy(products.name)
        .orderBy(desc(count(orders.id)))
        .limit(5),
    ])

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })

    const metrics = [
      { label: 'Orders Today', value: todayOrders[0]?.count ?? 0, sub: `${weekOrders[0]?.count ?? 0} this week`, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Revenue (Month)', value: `${org?.currency || 'KES'} ${Number(monthRevenue[0]?.total || 0).toLocaleString()}`, sub: `Total: ${org?.currency || 'KES'} ${Number(allRevenue[0]?.total || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Total Contacts', value: contactCount[0]?.count ?? 0, sub: 'all customers', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Active Products', value: productCount[0]?.count ?? 0, sub: `${allOrders[0]?.count ?? 0} orders total`, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]

    const STATUS_COLORS: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }

    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1 font-medium text-sm">Overview of your WhatsApp commerce performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/setup-booking"
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Users size={18} className="text-gray-400" />
              Book Setup
            </a>
            <a
              href="/dashboard/settings?tab=whatsapp"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
            >
              <Store size={18} />
              Store Settings
            </a>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${m.bg}`}>
                  <m.icon size={24} className={m.color} />
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{m.label.split(' ')[0]}</div>
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{m.value}</div>
              <div className="text-sm font-bold text-gray-500">{m.label}</div>
              <div className="h-px bg-gray-50 w-full my-3" />
              <div className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-green-500" />
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShoppingCart size={20} className="text-blue-600" />
                </div>
                <h2 className="font-black text-gray-900 tracking-tight">Recent Orders</h2>
              </div>
              <a href="/dashboard/orders" className="text-sm text-[#25D366] font-bold hover:underline">View All</a>
            </div>
            <div className="flex-1 divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={32} className="opacity-20" />
                  </div>
                  <p className="font-medium">No orders yet</p>
                  <p className="text-xs mt-1">Orders will appear once you connect WhatsApp.</p>
                </div>
              ) : recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {order.order_number.slice(-2)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-400 font-medium">{new Date(order.created_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 text-sm">{org?.currency} {order.total.toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${STATUS_COLORS[order.order_status || 'new']}`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Package size={20} className="text-orange-600" />
                </div>
                <h2 className="font-black text-gray-900 tracking-tight">Top Products</h2>
              </div>
              <a href="/dashboard/products" className="text-sm text-[#25D366] font-bold hover:underline">Manage</a>
            </div>
            <div className="flex-1 divide-y divide-gray-50">
              {topProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} className="opacity-20" />
                  </div>
                  <p className="font-medium">Inventory is empty</p>
                  <p className="text-xs mt-1">Add products to see performance here.</p>
                </div>
              ) : topProducts.map((p, i) => (
                <div key={p.name} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <span className={`text-sm font-black w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-400'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{p.count} units sold</p>
                  </div>
                  <TrendingUp size={16} className="text-green-500 opacity-50" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-primary rounded-2xl p-8 text-primary-foreground relative overflow-hidden shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-black mb-2 tracking-tight">Activate your WhatsApp Store</h2>
              <p className="font-medium opacity-90">Your automated shopping bot is ready. Just connect your WhatsApp Business API to start receiving orders directly in chat.</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/dashboard/settings?tab=whatsapp"
                className="bg-white text-primary px-8 py-4 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-xl"
              >
                Connect Now <ArrowRight size={18} className="inline ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    if (isRedirectError(error)) throw error
    console.error('Dashboard error:', error)
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <Package size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Database Connection Issue</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          We couldn&apos;t connect to your database. This is usually due to invalid credentials in your environment variables.
          {error?.status === 401 && <span className="block mt-2 font-mono text-xs text-red-600">Error 401: Unauthorized</span>}
        </p>
        <div className="flex gap-3">
          <a href="/dashboard" className="bg-[#25D366] text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition-colors">
            Try Again
          </a>
          <a href="/onboarding" className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors">
            Go to Onboarding
          </a>
        </div>
      </div>
    )
  }
}

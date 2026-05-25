import { db } from "@/lib/db";
import { organizations, products, orders, contacts, subscriptions, errorLogs, stores } from "@/lib/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Store, ShoppingBag, Users, AlertCircle, DollarSign, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrgDetailPage({ params }: { params: { id: string } }) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, params.id) });
  if (!org) return notFound();

  const orgProducts = await db.select().from(products).where(eq(products.org_id, org.id)).orderBy(desc(products.created_at)).limit(50);
  const orgOrders = await db.select({
    id: orders.id,
    order_number: orders.order_number,
    total: orders.total,
    currency: orders.currency,
    order_status: orders.order_status,
    payment_status: orders.payment_status,
    created_at: orders.created_at,
  }).from(orders).where(eq(orders.org_id, org.id)).orderBy(desc(orders.created_at)).limit(50);

  const [contactCount] = await db.select({ value: count() }).from(contacts).where(eq(contacts.org_id, org.id));
  const [errorCount] = await db.select({ value: count() }).from(errorLogs)
    .where(and(eq(errorLogs.org_id, org.id), eq(errorLogs.status, 'open')));

  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.org_id, org.id) });
  const orgStores = await db.select().from(stores).where(eq(stores.org_id, org.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/organizations" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">{org.name}</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">{org.slug} · {org.country} · {org.currency}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
            org.plan === 'elite' ? 'bg-amber-50 text-amber-600 border-amber-100' :
            org.plan === 'pro' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
            org.plan === 'starter' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            {org.plan || 'trial'}
          </span>
          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
            org.is_active === 1
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {org.is_active === 1 ? 'Active' : 'Suspended'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Products', value: orgProducts.length, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Orders', value: orgOrders.length, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Contacts', value: contactCount.value, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Stores', value: orgStores.length, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Open Errors', value: errorCount.value, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-lg flex items-center justify-center`}>
                <s.icon size={16} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className="text-xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Org Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4 italic font-serif">Organization Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400 font-bold">ID</span><span className="font-mono text-xs">{org.id}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">WhatsApp</span><span className={org.wa_phone_number_id ? 'text-emerald-600' : 'text-slate-300'}>{org.wa_phone_number_id ? 'Connected' : 'Not Set'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Theme</span><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ background: org.theme_color || '#25D366' }} /><span>{org.theme_color || '#25D366'}</span></div></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Created</span><span>{org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Subscription</span><span>{sub?.plan || 'None'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4 italic font-serif">AI Settings</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400 font-bold">AI Provider</span><span>{org.ai_provider || 'Chatevo'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Model</span><span>{org.ai_model || 'Default'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Greeting</span><span className="truncate max-w-[200px] text-right">{org.ai_system_prompt?.split('\n')[0] || 'Default'}</span></div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h2 className="font-bold text-slate-900 italic font-serif flex items-center gap-2"><Store size={18} className="text-primary" /> Products ({orgProducts.length})</h2>
        </div>
        {orgProducts.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orgProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-sm font-bold text-slate-800">{p.name}</td>
                  <td className="p-3 text-sm text-slate-600">{p.currency || 'USD'} {p.price}</td>
                  <td className="p-3 text-xs text-slate-500">{p.category || '-'}</td>
                  <td className="p-3 text-xs text-slate-500">{p.inventory_count ?? '-'}</td>
                  <td className="p-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${p.is_active === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {p.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-300">
            <Store size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">No products</p>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h2 className="font-bold text-slate-900 italic font-serif flex items-center gap-2"><ShoppingBag size={18} className="text-primary" /> Recent Orders ({orgOrders.length})</h2>
        </div>
        {orgOrders.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Order #</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orgOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-sm font-bold text-slate-800">{o.order_number}</td>
                  <td className="p-3 text-sm text-slate-600">{o.currency || 'USD'} {o.total}</td>
                  <td className="p-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                      o.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                      o.order_status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>{o.order_status}</span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                      o.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      o.payment_status === 'failed' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>{o.payment_status}</span>
                  </td>
                  <td className="p-3 text-xs text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-300">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">No orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

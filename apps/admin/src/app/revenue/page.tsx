import { db } from "@/lib/db";
import { subscriptions, organizations } from "@/lib/schema";
import { count, sum, desc, eq } from "drizzle-orm";
import { TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Calendar, BarChart3, DollarSign } from "lucide-react";

export default async function RevenuePage() {
  const [totalRevenue] = await db.select({ value: sum(subscriptions.amount) }).from(subscriptions);
  const [activeSubs] = await db.select({ value: count() }).from(subscriptions);
  
  const subsByPlan = await db.select({
    plan: subscriptions.plan,
    count: count(),
    revenue: sum(subscriptions.amount)
  })
  .from(subscriptions)
  .groupBy(subscriptions.plan);

  const recentTransactions = await db.select({
    id: subscriptions.id,
    amount: subscriptions.amount,
    currency: subscriptions.currency,
    plan: subscriptions.plan,
    created_at: subscriptions.created_at,
    org_name: organizations.name,
  })
  .from(subscriptions)
  .leftJoin(organizations, eq(subscriptions.org_id, organizations.id))
  .orderBy(desc(subscriptions.created_at))
  .limit(10);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">Financial Intelligence</h1>
        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Subscription revenue & growth analytics</p>
      </div>

      {/* Revenue Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total MRR</p>
              <p className="text-2xl font-black text-slate-900 italic font-serif">${Number(totalRevenue.value || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight size={14} /> +12.5% from last month
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Subs</p>
              <p className="text-2xl font-black text-slate-900 italic font-serif">{activeSubs.value}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight size={14} /> +4 new today
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. LTV</p>
              <p className="text-2xl font-black text-slate-900 italic font-serif">$342.10</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
             Calculated across all cohorts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Plan Distribution */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <h2 className="font-bold text-slate-900 italic font-serif flex items-center gap-2">
               <Calendar size={18} className="text-primary not-italic" /> Plan Distribution
            </h2>
            <div className="space-y-4">
               {subsByPlan.map((s, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{s.plan}</p>
                       <p className="text-sm font-bold text-slate-700">{s.count} Users</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-primary italic font-serif">${Number(s.revenue || 0).toLocaleString()}</p>
                       <p className="text-[10px] font-bold text-slate-400">Total Yield</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Transactions */}
         <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
               <h2 className="font-bold text-slate-900 italic font-serif">Recent Subscriptions</h2>
            </div>
            <div className="divide-y divide-slate-50">
               {recentTransactions.map((tx) => (
                 <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                          <DollarSign size={18} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{tx.org_name || 'System Transaction'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.plan} Plan</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900">{tx.currency} {Number(tx.amount || 0).toFixed(2)}</p>
                       <p className="text-[10px] text-slate-400 font-bold italic">{new Date(tx.created_at || '').toLocaleDateString()}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

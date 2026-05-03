import { db } from "@/lib/db";
import { organizations, users, subscriptions } from "@/lib/schema";
import { count, sum, desc } from "drizzle-orm";
import { Users, Store, DollarSign, UserPlus, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  // Fetch Metrics
  const [totalUsers] = await db.select({ value: count() }).from(users);
  const [totalStores] = await db.select({ value: count() }).from(organizations);
  const [totalSubscriptions] = await db.select({ value: count() }).from(subscriptions);
  const [activeMRR] = await db.select({ value: sum(subscriptions.amount) }).from(subscriptions);

  // Fetch Subscription Distribution
  const planCounts = await db.select({ plan: subscriptions.plan, count: count() }).from(subscriptions).groupBy(subscriptions.plan);
  const totalSubCount = planCounts.reduce((acc, curr) => acc + curr.count, 0);

  const distribution = [
    { label: "Starter", key: "starter", color: "bg-emerald-500", price: 3500 },
    { label: "Growth", key: "growth", color: "bg-indigo-500", price: 7000 },
    { label: "Elite", key: "elite", color: "bg-amber-500", price: 13000 },
  ].map(p => {
    const pCount = planCounts.find(pc => pc.plan.toLowerCase() === p.key)?.count || 0;
    return {
      label: `${p.label} ($${p.price})`,
      percentage: totalSubCount > 0 ? Math.round((pCount / totalSubCount) * 100) : 0,
      color: p.color
    };
  });

  const recentUsers = await db.select().from(users).orderBy(desc(users.created_at)).limit(5);

  const metrics = [
    { title: "Total Users", value: totalUsers.value, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Stores", value: totalStores.value, icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Paying Customers", value: totalSubscriptions.value, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "MRR", value: `$${Number(activeMRR.value || 0).toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const estimatedPayout = (Number(activeMRR.value || 0)) * 0.7; // 70% payout

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">Platform Overview</h1>
        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Real-time performance metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m: any, i: number) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <m.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{m.title}</h3>
            <p className="text-2xl font-black text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Signups */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 italic font-serif">
              <UserPlus size={18} className="text-primary not-italic" /> Recent Signups
            </h2>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers.map((user: any) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold">
                    {user.name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name || "Anonymous User"}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(user.created_at || "").toLocaleDateString()}</p>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">Starter</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Mix */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
             <h2 className="font-bold text-slate-900 mb-6 italic font-serif">Revenue Distribution</h2>
             <div className="space-y-6">
                {distribution.map((item: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>{item.label}</span>
                       <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Payout (70%)</p>
             <p className="text-xl font-black text-slate-900 italic font-serif">${estimatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

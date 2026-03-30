import { db } from "@/lib/db";
import { users, organizations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Search, Filter, MoreHorizontal, Shield, Eye, Ban, MessageCircle } from "lucide-react";

export default async function UsersPage() {
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    clerk_id: users.clerk_id,
    created_at: users.created_at,
    org: {
      name: organizations.name,
      plan: organizations.plan,
      country: organizations.country,
    }
  })
  .from(users)
  .leftJoin(organizations, eq(users.org_id, organizations.id))
  .orderBy(desc(users.created_at));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">User Management</h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Manage merchants and subscriptions</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                placeholder="Search name, email..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
              <Filter size={16} /> Filter
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Store / Plan</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Country</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold">
                      {user.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm font-bold text-slate-700">{user.org?.name}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                    user.org?.plan === 'premium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    user.org?.plan === 'growth' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {user.org?.plan || 'trial'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{(user.org?.country === 'KE' ? '🇰🇪' : user.org?.country === 'NG' ? '🇳🇬' : '🌍')}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{user.org?.country}</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic">
                    {new Date(user.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button title="Impersonate" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Eye size={18} />
                    </button>
                    <button title="Message" className="p-2 text-primary hover:bg-emerald-50 rounded-lg transition-all">
                      <MessageCircle size={18} />
                    </button>
                    <button title="Restrict" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Ban size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq, desc, not } from "drizzle-orm"
import { ShieldAlert, UserPlus, Search, MoreVertical, Shield, Zap, Target, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { approveUser, updateUserRole, restrictUser } from "@/lib/actions/admin"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function TeamManagementPage() {
  const { userId } = auth()
  const SUPER_ADMIN_ID = process.env.ADMIN_USER_ID

  if (!userId || userId !== SUPER_ADMIN_ID) {
    return redirect("/not-authorized")
  }

  const team = await db.select().from(users).orderBy(desc(users.created_at))
  
  const pending = team.filter(m => m.is_active === 0)
  const active = team.filter(m => m.is_active === 1)

  const stats = [
    { title: "Admins", count: active.filter(m => m.role === 'admin').length + 1, icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Support", count: active.filter(m => m.role === 'support').length, icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Pending", count: pending.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight font-serif flex items-center gap-3 italic">
            <ShieldAlert size={32} className="text-primary not-italic" /> Team Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage administrative access and roles for the Chatevo platform. Verify and authorize new staff members.</p>
        </div>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
             <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                <s.icon size={24} />
             </div>
             <h3 className="font-bold text-slate-800 text-lg">{s.title}</h3>
             <p className="text-4xl font-black text-slate-900 mt-2 italic font-serif tracking-tighter">{s.count < 10 ? `0${s.count}` : s.count}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest italic">
            <Clock size={20} className="text-amber-500 not-italic" /> Pending Authorization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map(user => (
              <div key={user.id} className="bg-white border-2 border-amber-100 p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center font-black text-amber-600 text-sm">
                      {user.name?.[0] || 'U'}
                   </div>
                   <div>
                      <p className="font-bold text-slate-900">{user.name || "New Staff"}</p>
                      <p className="text-xs text-slate-500 font-bold">{user.email}</p>
                   </div>
                </div>
                <form action={async (formData) => {
                  'use server'
                  const role = formData.get('role') as string
                  await approveUser(user.id, role)
                }} className="flex gap-2">
                   <select name="role" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-2">
                      <option value="admin">Admin</option>
                      <option value="support" selected>Support</option>
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                   </select>
                   <button type="submit" className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={20} />
                   </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Team */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden pb-4">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <h2 className="font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
             <Shield size={20} className="text-emerald-500 not-italic" /> Authorized Staff
           </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role & Permission</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Onboarded</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {active.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm group-hover:scale-110 transition-transform">
                         {member.name?.[0] || member.email[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base tracking-tight">{member.name || "Anonymous"}</p>
                        <p className="text-xs text-slate-500 font-bold tracking-tight">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      member.role === 'admin' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      member.role === 'support' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {member.role}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                       <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Active</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                       {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                     </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <form action={async () => {
                      'use server'
                      await restrictUser(member.id)
                    }}>
                      <button type="submit" className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                        <XCircle size={20} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

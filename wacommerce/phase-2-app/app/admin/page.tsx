import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { support_tickets, users, organizations, affiliates, referrals } from '@/lib/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import Link from 'next/link'
import {
  Shield, Ticket, Users, Clock, BarChart3,
  Gift, CreditCard, TrendingUp, CheckCircle2, XCircle, AlertCircle, Store
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color = 'text-slate-600' }: { label: string; value: string | number; icon: React.ElementType; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    trial: 'bg-amber-50 text-amber-700',
    starter: 'bg-emerald-50 text-emerald-700',
    growth: 'bg-blue-50 text-blue-700',
    elite: 'bg-purple-50 text-purple-700',
    open: 'bg-red-50 text-red-600',
    'in-progress': 'bg-amber-50 text-amber-600',
    resolved: 'bg-emerald-50 text-emerald-600',
    pending: 'bg-slate-100 text-slate-500',
    approved: 'bg-emerald-50 text-emerald-600',
    rejected: 'bg-red-50 text-red-500',
  }
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  )
}

export default async function AdminPage() {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_USER_ID) redirect('/dashboard')

  // Fetch all data in parallel
  const [allOrgs, tickets, allAffiliates, totalUsers] = await Promise.all([
    db.query.organizations.findMany({ orderBy: [desc(organizations.created_at)], limit: 50 }),
    db.query.support_tickets.findMany({ orderBy: [desc(support_tickets.created_at)], limit: 30, with: { user: true, org: true } }),
    db.query.affiliates.findMany({ orderBy: [desc(affiliates.created_at)], limit: 30 }),
    db.select({ count: count() }).from(users),
  ])

  const planBreakdown = allOrgs.reduce<Record<string, number>>((acc, o) => {
    const p = o.plan ?? 'trial'
    acc[p] = (acc[p] ?? 0) + 1
    return acc
  }, {})

  const openTickets = tickets.filter(t => t.status === 'open').length
  const pendingAffiliates = allAffiliates.filter(a => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Top Nav */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Chatevo Admin</span>
            <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">Super Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* === Stats Overview === */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Orgs" value={allOrgs.length} icon={Store} color="text-blue-500" />
            <StatCard label="Total Users" value={totalUsers[0]?.count ?? 0} icon={Users} color="text-emerald-500" />
            <StatCard label="Open Tickets" value={openTickets} icon={Ticket} color={openTickets > 0 ? 'text-red-500' : 'text-slate-400'} />
            <StatCard label="Pending Affiliates" value={pendingAffiliates} icon={Gift} color={pendingAffiliates > 0 ? 'text-amber-500' : 'text-slate-400'} />
          </div>

          {/* Plan Breakdown */}
          <div className="mt-4 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Plan Distribution</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(planBreakdown).map(([plan, cnt]) => (
                <div key={plan} className="flex items-center gap-2">
                  <Badge status={plan} />
                  <span className="font-bold text-slate-700 text-sm">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === Organizations Table === */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">All Organizations ({allOrgs.length})</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Organization', 'Plan', 'Trial Ends', 'WhatsApp', 'Referral Code', 'Created'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allOrgs.map(org => {
                    const daysLeft = org.trial_ends_at
                      ? Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)
                      : null
                    return (
                      <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{org.slug}</p>
                        </td>
                        <td className="px-5 py-4"><Badge status={org.plan ?? 'trial'} /></td>
                        <td className="px-5 py-4">
                          {org.trial_ends_at ? (
                            <span className={`text-xs font-medium ${daysLeft && daysLeft < 0 ? 'text-red-500' : daysLeft && daysLeft <= 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                              {daysLeft !== null && daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft !== null ? `${daysLeft}d left` : '—'}
                            </span>
                          ) : <span className="text-xs text-slate-300">Not set</span>}
                        </td>
                        <td className="px-5 py-4">
                          {org.wa_webhook_verified ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <XCircle size={16} className="text-slate-300" />
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                            {org.referral_code ?? '—'}
                          </code>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* === Support Tickets === */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Support Tickets ({tickets.length})</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {tickets.length === 0 ? (
              <div className="py-16 text-center text-slate-300">
                <Ticket size={32} className="mx-auto mb-3" />
                <p className="font-medium text-slate-400">No tickets yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['User / Org', 'Type', 'Subject', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tickets.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 text-xs">{(t as any).user?.email}</p>
                          <p className="text-xs text-slate-400">{(t as any).org?.name}</p>
                        </td>
                        <td className="px-5 py-4"><Badge status={t.type} /></td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700 max-w-xs truncate">{t.subject}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{t.description}</p>
                        </td>
                        <td className="px-5 py-4"><Badge status={t.status ?? 'open'} /></td>
                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* === Affiliate Applications === */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Affiliate Applications ({allAffiliates.length})</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {allAffiliates.length === 0 ? (
              <div className="py-16 text-center text-slate-300">
                <Gift size={32} className="mx-auto mb-3" />
                <p className="font-medium text-slate-400">No affiliate applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Affiliate', 'Code', 'Referred', 'Balance (KES)', 'Status', 'Joined'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allAffiliates.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-400">{a.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{a.referral_code}</code>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{a.total_referred ?? 0}</td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          KES {(a.balance ?? 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4"><Badge status={a.status ?? 'pending'} /></td>
                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 pb-4">Chatevo Admin Console · Protected Route</p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Search, Store, ExternalLink, Ban, CheckCircle, ArrowUpRight, Loader2, ChevronDown, Eye, MoreHorizontal, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Org = {
  id: string
  name: string
  slug: string
  plan: string | null
  country: string | null
  currency: string | null
  is_active: number | null
  wa_phone_number_id: string | null
  created_at: string | null
  product_count: number
  order_count: number
  open_errors: number
  subscription_plan: string | null
}

export default function OrganizationsClient({ initialData }: { initialData: Org[] }) {
  const [orgs, setOrgs] = useState<Org[]>(initialData)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = orgs.filter(o => {
    const matchesSearch = !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      (o.country || '').toLowerCase().includes(search.toLowerCase())
    const matchesPlan = !planFilter || (o.plan || 'trial') === planFilter
    return matchesSearch && matchesPlan
  })

  async function handleAction(orgId: string, action: 'suspend' | 'activate' | 'change_plan', plan?: string) {
    setActionLoading(orgId)
    try {
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, action, plan }),
      })
      if (res.ok) {
        setOrgs(orgs.map(o => {
          if (o.id !== orgId) return o
          if (action === 'suspend') return { ...o, is_active: 0 }
          if (action === 'activate') return { ...o, is_active: 1 }
          if (action === 'change_plan' && plan) return { ...o, plan }
          return o
        }))
      }
    } catch (err) {
      console.error('Action failed:', err)
    }
    setActionLoading(null)
    setOpenMenu(null)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Store className="w-7 h-7 text-primary" />
            Organizations
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {orgs.length} organizations · Full management control
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              placeholder="Search name, slug, country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-72"
            />
          </div>
          <div className="relative">
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">All Plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(org => {
          const isActive = org.is_active !== 0
          const hasWhatsApp = !!org.wa_phone_number_id
          return (
            <div key={org.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 truncate">{org.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">/{org.slug}</p>
                </div>
                <div className="relative ml-2">
                  <button
                    onClick={() => setOpenMenu(openMenu === org.id ? null : org.id)}
                    disabled={actionLoading === org.id}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-all"
                  >
                    {actionLoading === org.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                      <MoreHorizontal size={16} className="text-slate-400" />
                    )}
                  </button>
                  {openMenu === org.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1">
                      <Link
                        href={`/organizations/${org.id}`}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View Details
                      </Link>
                      {isActive && (
                        <button
                          onClick={() => handleAction(org.id, 'suspend')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          <Ban size={14} /> Suspend
                        </button>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => handleAction(org.id, 'activate')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle size={14} /> Activate
                        </button>
                      )}
                      <div className="border-t border-slate-100 my-1" />
                      <p className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Plan</p>
                      {['trial', 'starter', 'pro', 'elite'].filter(p => p !== org.plan).map(p => (
                        <button
                          key={p}
                          onClick={() => handleAction(org.id, 'change_plan', p)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <ArrowUpRight size={14} /> {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  org.plan === 'elite' ? 'text-amber-600 bg-amber-50' :
                  org.plan === 'pro' ? 'text-indigo-600 bg-indigo-50' :
                  org.plan === 'starter' ? 'text-emerald-600 bg-emerald-50' :
                  'text-slate-400 bg-slate-50'
                }`}>{org.plan || 'trial'}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                }`}>{isActive ? 'Active' : 'Suspended'}</span>
                {hasWhatsApp && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider text-green-600 bg-green-50">WA</span>
                )}
                {org.open_errors > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider text-red-600 bg-red-50 flex items-center gap-1">
                    <AlertCircle size={10} /> {org.open_errors}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-black text-slate-900">{org.product_count}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Products</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-black text-slate-900">{org.order_count}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-black text-slate-900">{org.country || '—'}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Country</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold">
                  {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                </p>
                <Link href={`/organizations/${org.id}`} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  Details <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

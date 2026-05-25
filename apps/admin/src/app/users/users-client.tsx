'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MoreHorizontal, Shield, Eye, Ban, CheckCircle, Users, ChevronDown, ArrowUpRight, Loader2 } from 'lucide-react'

type User = {
  id: string
  name: string | null
  email: string
  clerk_id: string
  created_at: string | null
  is_active: number | null
  org_id: string | null
  org_name: string | null
  org_plan: string | null
  org_country: string | null
  org_is_active: number | null
  plan: string | null
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (planFilter) params.set('plan', planFilter)
      params.set('limit', '200')
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setUsers(data.data || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [search, planFilter])

  async function handleAction(orgId: string, action: 'suspend' | 'activate' | 'change_plan', plan?: string) {
    setActionLoading(orgId)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, action, plan }),
      })
      if (res.ok) await fetchUsers()
    } catch (err) {
      console.error('Action failed:', err)
    }
    setActionLoading(null)
    setOpenMenu(null)
  }

  const plans = ['', 'trial', 'starter', 'pro', 'elite']

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            User Management
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {users.length} users · Manage merchants and subscriptions
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              placeholder="Search name, email, org..."
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">User</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Organization</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Plan</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Country</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Status</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Joined</th>
                <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-400 mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-bold text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : users.map(user => {
                const isActive = user.org_is_active !== 0
                return (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-sm text-slate-900">{user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-slate-700">{user.org_name || '—'}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.org_id?.slice(0, 12) || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        user.plan === 'elite' ? 'text-amber-600 bg-amber-50' :
                        user.plan === 'pro' ? 'text-indigo-600 bg-indigo-50' :
                        user.plan === 'starter' ? 'text-emerald-600 bg-emerald-50' :
                        'text-slate-400 bg-slate-50'
                      }`}>
                        {user.plan || 'trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{user.org_country || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          disabled={actionLoading === user.org_id}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-all"
                        >
                          {actionLoading === user.org_id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <MoreHorizontal size={16} className="text-slate-400" />
                          )}
                        </button>
                        {openMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1">
                            {user.org_id && (
                              <a
                                href={`/organizations/${user.org_id}`}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Eye size={14} /> View Organization
                              </a>
                            )}
                            {user.org_id && isActive && (
                              <button
                                onClick={() => handleAction(user.org_id!, 'suspend')}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Ban size={14} /> Suspend Organization
                              </button>
                            )}
                            {user.org_id && !isActive && (
                              <button
                                onClick={() => handleAction(user.org_id!, 'activate')}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <CheckCircle size={14} /> Activate Organization
                              </button>
                            )}
                            {user.org_id && (
                              <>
                                <div className="border-t border-slate-100 my-1" />
                                <p className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Plan</p>
                                {plans.filter(p => p && p !== user.plan).map(p => (
                                  <button
                                    key={p}
                                    onClick={() => handleAction(user.org_id!, 'change_plan', p)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    <ArrowUpRight size={14} /> Switch to {p}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

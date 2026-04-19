'use client'

import React, { useState } from 'react'
import { Check, Globe, LayoutGrid, Search, Filter, ChevronRight, UserPlus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Org {
  id: string
  name: string
  slug: string
  country: string | null
  currency: string | null
  business_type: string | null
  created_at: string | null
}

export default function WaitlistClient({ initialOrgs }: { initialOrgs: any[] }) {
  const router = useRouter()
  const [orgs, setOrgs] = useState<Org[]>(initialOrgs)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.country || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const bulkOnboard = async () => {
    if (selected.size === 0) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/bulk-onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgIds: Array.from(selected) })
      })
      if (response.ok) {
        setOrgs(orgs.filter(o => !selected.has(o.id)))
        setSelected(new Set())
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by name or country..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {selected.size > 0 && (
          <div className="flex items-center gap-3 animate-in slide-in-from-right duration-300">
            <span className="text-sm font-bold text-gray-500">{selected.size} Selected</span>
            <button 
              onClick={bulkOnboard}
              disabled={isLoading}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              Bulk Approve & Onboard
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4">
                  <div 
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${selected.size === filteredOrgs.length ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-300'}`}
                    onClick={() => {
                      if (selected.size === filteredOrgs.length) setSelected(new Set())
                      else setSelected(new Set(filteredOrgs.map(o => o.id)))
                    }}
                  >
                    {selected.size === filteredOrgs.length && <Check className="text-white w-3 h-3" />}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Business Info</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest leading-none text-center">Location</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest leading-none text-center">Plan</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest leading-none text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 uppercase text-sm font-bold">
              {filteredOrgs.map(org => (
                <tr key={org.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div 
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${selected.has(org.id) ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-200'}`}
                      onClick={() => toggleSelect(org.id)}
                    >
                      {selected.has(org.id) && <Check className="text-white w-3 h-3" />}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-gray-900">{org.name}</p>
                        <p className="text-xs font-medium text-gray-400 lowercase">{org.slug}.chatevo.ai</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black border border-emerald-100">
                      <Globe className="w-3 h-3" />
                      {org.country || 'Global'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-black border border-amber-100">
                      Trial Gated
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => { setSelected(new Set([org.id])); bulkOnboard() }}
                      className="text-[#25D366] hover:text-[#128C7E] px-4 py-2 hover:bg-white rounded-xl transition-all"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium italic">
                    No businesses matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { CheckCircle2, XCircle, Search, Wallet, AlertTriangle, ShieldCheck } from 'lucide-react'
import { approveAffiliate, rejectAffiliate, processPayout } from './actions'

type Affiliate = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string | null;
  terms_accepted: number | null;
  balance: number | null;
}

export function AffiliatesClient({ initialData }: { initialData: Affiliate[] }) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    const res = await approveAffiliate(id)
    if (res.success) {
      setAffiliates(affiliates.map(a => a.id === id ? { ...a, status: 'approved' } : a))
    }
    setLoadingId(null)
  }

  const handleReject = async (id: string) => {
    setLoadingId(id)
    const res = await rejectAffiliate(id)
    if (res.success) {
      setAffiliates(affiliates.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
    }
    setLoadingId(null)
  }

  const handlePayout = async (id: string, balance: number) => {
    if (!confirm(`Process manual payout of $${balance}?`)) return
    setLoadingId(id)
    const res = await processPayout(id, balance)
    if (res.success) {
      setAffiliates(affiliates.map(a => a.id === id ? { ...a, balance: 0 } : a))
      alert('Payout recorded successfully.')
    } else {
      alert(`Error processing payout: ${res.error}`)
    }
    setLoadingId(null)
  }

  const filtered = affiliates.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight font-serif flex items-center gap-3">
            <ShieldCheck className="text-primary" /> Affiliate Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">Approve new sellers and process payouts.</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search affiliates..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Partner</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status / Terms</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Balance</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-500 font-medium truncate w-32" title={a.id}>ID: {a.id}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-700 text-sm">{a.email}</p>
                  <p className="text-xs text-slate-500">{a.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    {a.status === 'pending' && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pending</span>}
                    {a.status === 'approved' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Approved</span>}
                    {a.status === 'rejected' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Rejected</span>}
                  </div>
                  {a.terms_accepted ? <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><CheckCircle2 size={12}/> T&C Signed</span> : null}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-black ${(a.balance || 0) >= 100 ? 'text-primary' : 'text-slate-800'}`}>${(a.balance || 0).toFixed(2)}</p>
                    {(a.balance || 0) >= 100 && <AlertTriangle size={16} className="text-amber-500" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {a.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(a.id)} disabled={loadingId === a.id} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                        <CheckCircle2 size={18} />
                      </button>
                      <button onClick={() => handleReject(a.id)} disabled={loadingId === a.id} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  {a.status === 'approved' && (a.balance || 0) >= 100 && (
                    <button onClick={() => handlePayout(a.id, a.balance || 0)} disabled={loadingId === a.id} className="bg-primary text-white hover:opacity-90 px-4 py-2 text-sm rounded-lg font-bold transition-colors shadow-sm shadow-primary/20 flex items-center gap-2 float-right disabled:opacity-50">
                      <Wallet size={16} /> Pay ${(a.balance || 0).toFixed(2)}
                    </button>
                  )}
                  {a.status === 'approved' && (a.balance || 0) < 100 && (
                    <span className="text-xs text-slate-400 font-medium">Below Min.</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No affiliates found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { LifeBuoy, Clock, ArrowRight, ShieldCheck, Search, Loader2, CheckCircle2, XCircle, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { updateTicketStatus, deleteTicket } from './actions'

type Ticket = {
  id: string
  subject: string
  description: string | null
  status: string | null
  type: string | null
  created_at: string | null
  user_name: string | null
  user_email: string | null
  org_name: string | null
}

export default function TicketsClient({ initialData }: { initialData: Ticket[] }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleStatus(id: string, status: string) {
    setLoadingId(id)
    const res = await updateTicketStatus(id, status)
    if (res.success) {
      setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))
    }
    setLoadingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    setLoadingId(id)
    const res = await deleteTicket(id)
    if (res.success) {
      setTickets(tickets.filter(t => t.id !== id))
    }
    setLoadingId(null)
  }

  const filtered = tickets.filter(t =>
    (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.org_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight flex items-center gap-3">
            <LifeBuoy size={32} className="text-primary not-italic" /> Support Tickets
          </h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Manage all incoming support requests</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User / Org</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type & Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-slate-900">{ticket.user_name || ticket.user_email}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ticket.org_name || 'No Org'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {ticket.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700 border-amber-200' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <p className="text-sm font-bold text-slate-800">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">{ticket.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Link href={`/tickets/${ticket.id}`} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="View">
                        <Eye size={16} />
                      </Link>
                      {ticket.status === 'open' && (
                        <button onClick={() => handleStatus(ticket.id, 'in-progress')} disabled={loadingId === ticket.id} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50" title="Mark In Progress">
                          <Loader2 size={16} />
                        </button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <button onClick={() => handleStatus(ticket.id, 'resolved')} disabled={loadingId === ticket.id} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50" title="Resolve">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(ticket.id)} disabled={loadingId === ticket.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300">
                    <LifeBuoy size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No tickets found</p>
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
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Building2, Tag, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { getTicket, updateTicketStatus, deleteTicket } from './actions'

type Ticket = {
  id: string
  subject: string
  description: string | null
  status: string | null
  type: string | null
  created_at: string | null
  org_id: string
  user_id: string
}

export function TicketClient({ initialTicket }: { initialTicket: Ticket | null }) {
  const [ticket, setTicket] = useState<Ticket | null>(initialTicket)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleStatusChange(status: string) {
    if (!ticket) return
    setLoading(true)
    const res = await updateTicketStatus(ticket.id, status)
    if (res.success) {
      setTicket({ ...ticket, status })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!ticket) return
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    setLoading(true)
    const res = await deleteTicket(ticket.id)
    if (res.success) {
      window.location.href = '/tickets'
    }
    setLoading(false)
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p className="font-bold">Ticket not found</p>
        <Link href="/tickets" className="mt-2 text-primary hover:underline text-sm font-medium">Back to tickets</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/tickets" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Tag size={22} className="text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{ticket.subject}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <Clock size={12} />
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                </span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {ticket.type}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  ticket.status === 'open' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100'
                }`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-slate-400" />
            <span className="font-medium text-slate-600">User ID:</span>
            <span className="font-mono text-xs text-slate-400">{ticket.user_id}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={14} className="text-slate-400" />
            <span className="font-medium text-slate-600">Org ID:</span>
            <span className="font-mono text-xs text-slate-400">{ticket.org_id}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleStatusChange('in-progress')}
            disabled={loading || ticket.status === 'in-progress'}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Mark In Progress
          </button>
          <button
            onClick={() => handleStatusChange('resolved')}
            disabled={loading || ticket.status === 'resolved'}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Mark Resolved
          </button>
          <button
            onClick={() => handleStatusChange('open')}
            disabled={loading || ticket.status === 'open'}
            className="flex items-center gap-2 bg-amber-50 text-amber-600 hover:bg-amber-100 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Reopen
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold transition-all ml-auto disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useTransition } from "react"
import { HandCoins, CheckCircle2, XCircle, Clock, ExternalLink, AlertCircle } from "lucide-react"
import { markPayoutPaid, rejectPayout } from "../actions"

interface PayoutRow {
  id: string
  amount: number
  status: string
  notes: string | null
  created_at: string | null
  processed_at: string | null
  affiliate_id: string
  affiliate_name: string
  affiliate_email: string
  affiliate_payment_details: string | null
  affiliate_balance: number
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  paid: <CheckCircle2 size={12} />,
  rejected: <XCircle size={12} />,
}

export function PayoutsClient({ initialData }: { initialData: PayoutRow[] }) {
  const [rows, setRows] = useState<PayoutRow[]>(initialData)
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "rejected">("pending")
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter)

  const handleMarkPaid = (id: string) => {
    setActionError(null)
    startTransition(async () => {
      const res = await markPayoutPaid(id)
      if (res.success) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, status: "paid", processed_at: new Date().toISOString() } : r))
      } else {
        setActionError(res.error || "Failed to mark as paid.")
      }
    })
  }

  const handleReject = (id: string) => {
    setActionError(null)
    startTransition(async () => {
      const res = await rejectPayout(id)
      if (res.success) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r))
      } else {
        setActionError(res.error || "Failed to reject payout.")
      }
    })
  }

  const pendingCount = rows.filter(r => r.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pendingCount} pending request{pendingCount !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "paid", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {actionError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <HandCoins size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-bold text-muted-foreground">No payout requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => (
            <div key={row.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
              {/* Affiliate info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{row.affiliate_name}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold capitalize ${STATUS_STYLES[row.status] || "bg-slate-100 text-slate-600"}`}>
                    {STATUS_ICONS[row.status]} {row.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{row.affiliate_email}</p>
                {row.affiliate_payment_details && (
                  <p className="text-xs font-mono text-slate-500 mt-1 truncate">
                    Payout to: {row.affiliate_payment_details}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Requested: {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  {row.processed_at && ` · Processed: ${new Date(row.processed_at).toLocaleString()}`}
                </p>
                {row.notes && <p className="text-xs text-slate-400 mt-1 italic">{row.notes}</p>}
              </div>

              {/* Amount */}
              <div className="text-right md:text-center md:w-28 flex-shrink-0">
                <p className="text-2xl font-black text-foreground">${row.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Balance after: ${(row.affiliate_balance - (row.status === "pending" ? row.amount : 0)).toFixed(2)}</p>
              </div>

              {/* Actions */}
              {row.status === "pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMarkPaid(row.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Mark Paid
                  </button>
                  <button
                    onClick={() => handleReject(row.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

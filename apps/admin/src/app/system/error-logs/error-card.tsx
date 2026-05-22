'use client'

import { Copy } from 'lucide-react'
import { useState } from 'react'

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'high') {
    return <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">High</span>
  }
  return <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Low</span>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'fixed') return <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Fixed</span>
  if (status === 'investigating') return <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Investigating</span>
  return <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Open</span>
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    store_engine: 'text-purple-600 bg-purple-50',
    payment: 'text-blue-600 bg-blue-50',
    catalog: 'text-indigo-600 bg-indigo-50',
    webhook: 'text-orange-600 bg-orange-50',
    general: 'text-slate-600 bg-slate-50',
  }
  const cls = colors[category] || colors.general
  return <span className={`text-[10px] font-black ${cls} px-2 py-0.5 rounded-full uppercase tracking-wider`}>{category}</span>
}

export function ErrorLogCard({ log }: { log: any }) {
  const [status, setStatus] = useState(log.status)
  const [copied, setCopied] = useState(false)

  const copyText = `Error: ${log.message}\nSeverity: ${log.severity}\nCategory: ${log.category}\nCause: ${log.cause || 'Unknown'}\nFix: ${log.fix || 'No fix available'}\nOrg: ${log.org_name || log.org_slug || log.org_id}\nTime: ${log.created_at}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch('/api/error-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: log.id, status: newStatus }),
      })
      if (res.ok) setStatus(newStatus)
    } catch { /* ignore */ }
  }

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 transition-all ${log.severity === 'high' && status === 'open' ? 'border-red-200 shadow-red-50' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <SeverityBadge severity={log.severity} />
            <CategoryBadge category={log.category} />
            <StatusBadge status={status} />
            {log.org_name && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                {log.org_name}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 break-words">{log.message}</p>
          {log.cause && (
            <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
              <span className="font-black text-slate-600 block mb-0.5">Cause:</span> {log.cause}
            </div>
          )}
          {log.fix && (
            <div className="mt-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3">
              <span className="font-black text-emerald-600 block mb-0.5">How to fix:</span> {log.fix}
            </div>
          )}
          {log.stack && (
            <details className="mt-1.5">
              <summary className="text-[11px] font-bold text-slate-400 cursor-pointer hover:text-slate-600">Stack trace</summary>
              <pre className="mt-1 text-[10px] text-slate-400 bg-slate-50 rounded-xl p-3 overflow-x-auto max-h-32">{log.stack}</pre>
            </details>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all relative"
            title="Copy error details"
          >
            {copied ? <span className="text-[10px] font-black text-green-600">OK</span> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <span className="text-[10px] font-bold text-slate-400">
          {new Date(log.created_at).toLocaleString()}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => updateStatus('investigating')}
            disabled={status === 'investigating' || status === 'fixed'}
            className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider transition-all"
          >
            Investigating
          </button>
          <button
            onClick={() => updateStatus('fixed')}
            disabled={status === 'fixed'}
            className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider transition-all"
          >
            Mark Fixed
          </button>
        </div>
      </div>
    </div>
  )
}

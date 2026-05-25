'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export function QuickActions() {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ action: string; success: boolean; message: string } | null>(null)
  const [panicConfirm, setPanicConfirm] = useState(false)

  async function runAction(action: string, enable?: boolean) {
    setLoading(action)
    setResult(null)
    try {
      const url = enable !== undefined ? `/api/system/actions?enable=${enable}` : '/api/system/actions'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      setResult({ action, success: data.success, message: data.message || data.error })
    } catch (err) {
      setResult({ action, success: false, message: 'Request failed' })
    }
    setLoading(null)
    setPanicConfirm(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
      <h2 className="font-bold text-slate-900 mb-6 italic font-serif">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => runAction('clear_cache')}
          disabled={loading !== null}
          className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:bg-slate-100 transition-all group disabled:opacity-50"
        >
          {loading === 'clear_cache' ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Clear Cache</p>
          )}
          <p className="text-[9px] text-slate-400 font-medium mt-1">Reset Upstash Redis keys</p>
        </button>

        <button
          onClick={() => runAction('flush_logs')}
          disabled={loading !== null}
          className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:bg-slate-100 transition-all group disabled:opacity-50"
        >
          {loading === 'flush_logs' ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Flush Logs</p>
          )}
          <p className="text-[9px] text-slate-400 font-medium mt-1">Delete resolved errors older than 30 days</p>
        </button>

        <button
          disabled
          className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left opacity-50 cursor-not-allowed"
        >
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Backup DB</p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">Use Turso CLI: turso db copy</p>
        </button>

        {!panicConfirm ? (
          <button
            onClick={() => setPanicConfirm(true)}
            disabled={loading !== null}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl text-left hover:bg-red-100 transition-all group disabled:opacity-50"
          >
            <p className="text-xs font-black uppercase tracking-widest text-red-600">Panic Mode</p>
            <p className="text-[9px] text-red-400 font-medium mt-1">Disable all store checkouts</p>
          </button>
        ) : (
          <div className="p-4 bg-red-100 border-2 border-red-300 rounded-2xl space-y-2">
            <p className="text-xs font-black text-red-700">Are you sure? This disables ALL stores.</p>
            <div className="flex gap-2">
              <button
                onClick={() => runAction('panic_mode', true)}
                disabled={loading !== null}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {loading === 'panic_mode' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Yes, Disable All'}
              </button>
              <button
                onClick={() => setPanicConfirm(false)}
                className="flex-1 px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-bold ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {result.message}
        </div>
      )}
    </div>
  )
}

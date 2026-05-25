'use client'

import { useRouter, usePathname } from 'next/navigation'

export function ErrorLogsFilter({ currentSource, currentSeverity }: { currentSource: string; currentSeverity: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function setFilter(source: string, severity: string) {
    const params = new URLSearchParams()
    if (source !== 'all') params.set('source', source)
    if (severity !== 'all') params.set('severity', severity)
    const qs = params.toString()
    router.push(pathname + (qs ? `?${qs}` : ''))
  }

  const sources = [
    { key: 'all', label: 'All Sources' },
    { key: 'server', label: 'Server' },
    { key: 'client', label: 'Client' },
  ]

  const severities = [
    { key: 'all', label: 'All Severity' },
    { key: 'high', label: 'High' },
    { key: 'low', label: 'Low' },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
        {sources.map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key, currentSeverity)}
            className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              currentSource === s.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
        {severities.map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(currentSource, s.key)}
            className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              currentSeverity === s.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

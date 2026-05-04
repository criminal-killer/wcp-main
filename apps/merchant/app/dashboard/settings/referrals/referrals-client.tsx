'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function ReferralsClient({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-emerald-950/50 p-2 rounded-xl border border-emerald-800/50">
      <code className="text-xs text-emerald-200 flex-1 truncate px-2 font-bold tracking-tight">
        {referralLink}
      </code>
      <button
        onClick={copy}
        className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 p-2 rounded-lg transition-colors font-bold shadow-sm flex items-center"
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  )
}

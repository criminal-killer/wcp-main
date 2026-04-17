'use client'
import { useState, useEffect } from 'react'

export function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0)
  const [sub, setSub] = useState(0)
  const [rev, setRev] = useState(false)

  useEffect(() => {
    if (!rev && sub === texts[idx].length + 1) { setTimeout(() => setRev(true), 1800); return }
    if (rev && sub === 0) { setRev(false); setIdx(p => (p + 1) % texts.length); return }
    const t = setTimeout(() => setSub(p => p + (rev ? -1 : 1)), rev ? 40 : 95)
    return () => clearTimeout(t)
  }, [sub, idx, rev, texts])

  return (
    <span>
      {texts[idx].substring(0, sub)}
      <span className="inline-block w-0.5 h-[1em] bg-emerald-500 ml-0.5 align-middle animate-pulse" />
    </span>
  )
}

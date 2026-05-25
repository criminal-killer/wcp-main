'use client'

import { useState } from 'react'
import { Download, UserCheck, Loader2 } from 'lucide-react'

type Entry = {
  id: string
  full_name: string
  email: string
  business_type: string | null
  country: string | null
  pricing_willingness: string | null
  created_at: string | null
}

export function WaitlistActions({ entries }: { entries: Entry[] }) {
  const [migrating, setMigrating] = useState(false)

  function exportCSV() {
    const headers = ['Name', 'Email', 'Business Type', 'Country', 'Willingness', 'Joined']
    const rows = entries.map(e => [
      e.full_name,
      e.email,
      e.business_type || '',
      e.country || '',
      e.pricing_willingness || '',
      e.created_at || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatevo-waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function migrateAll() {
    setMigrating(true)
    try {
      const res = await fetch('/api/waitlist/migrate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`Migrated ${data.count} waitlist entries`)
      } else {
        alert(data.error || 'Migration failed')
      }
    } catch {
      alert('Migration request failed')
    }
    setMigrating(false)
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={exportCSV}
        className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
      >
        <Download size={16} /> Export CSV
      </button>
      <button
        onClick={migrateAll}
        disabled={migrating}
        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
      >
        {migrating ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
        {migrating ? 'Migrating...' : 'Migrate All'}
      </button>
    </div>
  )
}

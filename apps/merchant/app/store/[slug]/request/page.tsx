'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Check, Loader2, ShoppingBag } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function RequestPage() {
  const params = useParams()
  const slug = params.slug as string
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ whatsappLink: string } | null>(null)
  const [error, setError] = useState('')

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h1>
        <p className="text-gray-500 mb-8">The store owner will get back to you.</p>
        <a href={result.whatsappLink} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
          <MessageCircle size={24} />
          Chat on WhatsApp
        </a>
        <Link href={`/store/${slug}`} className="block mt-4 text-sm text-gray-500 hover:text-emerald-600 underline">
          Back to store
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) { setError('Phone is required'); return }
    if (!message.trim()) { setError('Please describe what you need'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/store/${slug}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send'); setSubmitting(false); return }
      setResult(data)
    } catch {
      setError('Network error')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href={`/store/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to store
      </Link>

      <div className="text-center mb-8">
        <ShoppingBag size={40} className="mx-auto text-emerald-600 mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Request an Item</h1>
        <p className="text-gray-500 mt-1">Don&apos;t see what you need? Let us know and we&apos;ll try to get it for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="Your name (optional)" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp Number *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} required type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="e.g. 254712345678" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">What are you looking for? *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
            placeholder="Describe the product or service you need..." />
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">{error}</div>}
        <button type="submit" disabled={submitting}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : <>Send Request</>}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Store, Globe, Phone, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'

export default function NewStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    store_type: 'physical',
    description: '',
    currency: 'USD',
    delivery_fee: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          store_type: form.store_type,
          description: form.description,
          currency: form.currency,
          delivery_fee: form.delivery_fee ? parseFloat(form.delivery_fee) : 0,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create store')
        return
      }

      router.push(`/dashboard/stores/${data.data.id}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/stores"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Stores
      </Link>

      <div className="bg-card rounded-3xl border border-border p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-whatsapp/10 text-whatsapp rounded-xl flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Create New Store</h1>
            <p className="text-sm text-muted-foreground">Set up a separate store for a different brand or product type</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Store Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
              placeholder="e.g. Sarah's Fashion, TechZone Digital"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Store Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'physical', label: 'Physical', desc: 'Sell physical products' },
                { value: 'digital', label: 'Digital', desc: 'E-books, courses, etc.' },
                { value: 'services', label: 'Services', desc: 'Bookings & appointments' },
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, store_type: type.value })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.store_type === type.value
                      ? 'border-whatsapp bg-whatsapp/5 text-foreground'
                      : 'border-border bg-secondary text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  <p className="font-bold text-sm">{type.label}</p>
                  <p className="text-[10px] mt-0.5 font-medium">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp resize-none"
              placeholder="Tell customers what makes your store special..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (EUR)</option>
                <option value="GBP">GBP (GBP)</option>
                <option value="KES">KES (KSh)</option>
                <option value="NGN">NGN (NGN)</option>
                <option value="ZAR">ZAR (ZAR)</option>
                <option value="GHS">GHS (GHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Default Delivery Fee</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.delivery_fee}
                onChange={e => setForm({ ...form, delivery_fee: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                placeholder="0.00"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600 font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="w-full bg-whatsapp text-white py-4 rounded-xl font-black text-base hover:bg-green-600 transition-all shadow-lg shadow-whatsapp/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Create Store
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
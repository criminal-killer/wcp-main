'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Store, Globe, Phone, ShieldCheck, Loader2, CheckCircle2, Plus, X } from 'lucide-react'

const CATEGORY_PRESETS: Record<string, string[]> = {
  physical: ['Clothing & Fashion', 'Electronics & Gadgets', 'Food & Beverages', 'Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Jewelry & Accessories', 'Kids & Baby'],
  digital: ['E-Books & PDFs', 'Online Courses', 'Software & Licenses', 'Music & Audio', 'Graphics & Templates', 'Photography & Art', 'Games & In-Game Items'],
  services: ['Hair & Beauty', 'Photography & Events', 'Cleaning Services', 'Repairs & Maintenance', 'Consulting & Coaching', 'Catering & Events', 'Transportation & Delivery'],
}

type CategoryPreset = string

export default function NewStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    store_type: 'physical',
    description: '',
    currency: 'USD',
    delivery_fee: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [customCategory, setCustomCategory] = useState('')

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function addCustomCategory() {
    const cat = customCategory.trim()
    if (cat && !selectedCategories.includes(cat)) {
      setSelectedCategories(prev => [...prev, cat])
    }
    setCustomCategory('')
  }

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
          default_categories: JSON.stringify(selectedCategories),
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

        <div className="flex items-center gap-2 mb-6">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${step >= 1 ? 'bg-whatsapp text-white' : 'bg-secondary text-muted-foreground'}`}>1</span>
          <span className="flex-1 h-0.5 bg-border" />
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${step >= 2 ? 'bg-whatsapp text-white' : 'bg-secondary text-muted-foreground'}`}>2</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <>
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
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="NGN">NGN</option>
                    <option value="ZAR">ZAR</option>
                    <option value="GHS">GHS</option>
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
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.name.trim()}
                className="w-full bg-whatsapp text-white py-4 rounded-xl font-black text-base hover:bg-green-600 transition-all shadow-lg shadow-whatsapp/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Next: Add Categories <CheckCircle2 size={18} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">
                  What categories will this store sell? <span className="text-muted-foreground font-normal">(Select all that apply)</span>
                </label>
                <p className="text-xs text-muted-foreground mb-3">The AI will use these to guide customers through your products.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CATEGORY_PRESETS[form.store_type]?.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedCategories.includes(cat)
                          ? 'bg-whatsapp/10 border-whatsapp text-whatsapp'
                          : 'bg-secondary border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                    className="flex-1 px-4 py-2 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                    placeholder="Add custom category..."
                  />
                  <button type="button" onClick={addCustomCategory} className="p-2 bg-secondary rounded-xl hover:bg-muted-foreground/20 transition-colors">
                    <Plus size={18} className="text-muted-foreground" />
                  </button>
                </div>
                {selectedCategories.length > 0 && (
                  <div className="mt-4 p-4 bg-secondary rounded-xl">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Selected Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map(cat => (
                        <span key={cat} className="flex items-center gap-1 px-3 py-1 bg-whatsapp/10 text-whatsapp rounded-full text-xs font-bold">
                          {cat}
                          <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-red-500">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-secondary text-foreground py-4 rounded-xl font-black text-base hover:bg-muted-foreground/20 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.name.trim()}
                  className="flex-1 bg-whatsapp text-white py-4 rounded-xl font-black text-base hover:bg-green-600 transition-all shadow-lg shadow-whatsapp/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
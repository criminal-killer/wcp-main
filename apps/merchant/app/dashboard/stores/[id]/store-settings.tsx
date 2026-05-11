'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Store, Globe, Phone, ShieldCheck, Loader2,
  CheckCircle2, AlertTriangle, Trash2, Star
} from 'lucide-react'
import { PLAN_CONFIG, normalizePlan } from '@/lib/payments'

// Inline types matching schema
type StoreType = {
  id: string; name: string; slug: string; store_type: string | null;
  description: string | null; currency: string | null; delivery_fee: number | null;
  theme_color: string | null; wa_phone_number_id: string | null;
  wa_business_account_id: string | null; is_default: number | null;
}
type OrgType = { id: string; name: string; plan: string | null } | null

export default function StoreSettings({ store, org }: { store: StoreType; org: OrgType | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: store.name || '',
    store_type: store.store_type || 'physical',
    description: store.description || '',
    currency: store.currency || 'USD',
    delivery_fee: store.delivery_fee || 0,
    theme_color: store.theme_color || '#25D366',
    wa_phone_number_id: store.wa_phone_number_id || '',
    wa_business_account_id: store.wa_business_account_id || '',
    is_default: store.is_default === 1,
  })

  const plan = normalizePlan(org?.plan || 'starter')
  const storeLimit = PLAN_CONFIG[plan].store_limit

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: store.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/stores"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Stores
      </Link>

      {/* Store Header */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-whatsapp/10 text-whatsapp rounded-xl flex items-center justify-center">
            <Store size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight">{store.name}</h1>
              {form.is_default && (
                <span className="flex items-center gap-1 text-[10px] font-black bg-whatsapp/10 text-whatsapp px-2 py-0.5 rounded-full uppercase tracking-widest">
                  <Star size={8} /> Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-whatsapp font-medium transition-colors"
              >
                <Globe size={12} /> /store/{store.slug}
              </a>
              <span className="text-xs text-muted-foreground capitalize">{store.store_type || 'physical'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* General */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
            <Store size={16} className="text-muted-foreground" /> General
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Store Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Store Type</label>
              <select
                value={form.store_type}
                onChange={e => setForm({ ...form, store_type: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
              >
                <option value="physical">Physical Products</option>
                <option value="digital">Digital Products</option>
                <option value="services">Services / Bookings</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp resize-none"
                placeholder="What makes your store special..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Currency</label>
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
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Delivery Fee</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.delivery_fee}
                  onChange={e => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.theme_color}
                  onChange={e => setForm({ ...form, theme_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={form.theme_color}
                  onChange={e => setForm({ ...form, theme_color: e.target.value })}
                  className="flex-1 px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                  placeholder="#25D366"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
            <Phone size={16} className="text-muted-foreground" /> WhatsApp (Per-Store)
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-amber-700 font-medium">
              Connect a separate WhatsApp number for this store. If left empty, this store will use your main WhatsApp number.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Phone Number ID</label>
              <input
                type="text"
                value={form.wa_phone_number_id}
                onChange={e => setForm({ ...form, wa_phone_number_id: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                placeholder="From Meta Business > WhatsApp > Phone Numbers"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Business Account ID</label>
              <input
                type="text"
                value={form.wa_business_account_id}
                onChange={e => setForm({ ...form, wa_business_account_id: e.target.value })}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                placeholder="WABA ID from Meta"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={e => setForm({ ...form, is_default: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#25D366]"
                />
                <span className="text-sm font-bold text-foreground">Set as default store</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1 text-sm font-bold text-green-600">
                  <CheckCircle2 size={14} /> Saved!
                </span>
              )}
              {error && (
                <span className="flex items-center gap-1 text-sm font-bold text-red-600">
                  <AlertTriangle size={14} /> {error}
                </span>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-whatsapp text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-green-600 transition-all shadow-lg shadow-whatsapp/20 disabled:opacity-50"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
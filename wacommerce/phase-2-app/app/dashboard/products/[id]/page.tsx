'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    inventory_count: '',
    type: 'physical' as 'physical' | 'digital' | 'service',
    digital_content: '',
    is_active: 1,
  })
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  const [variants, setVariants] = useState<Array<{ type: string; options: string }>>([])

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error('Failed to fetch product')
        const { data } = await res.json()
        
        setForm({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          compare_at_price: data.compare_at_price?.toString() || '',
          category: data.category || '',
          inventory_count: data.inventory_count?.toString() || '0',
          type: (data.type as any) || 'physical',
          digital_content: data.digital_content || '',
          is_active: data.is_active ?? 1,
        })
        
        setImages(JSON.parse(data.images || '[]'))
        
        const rawVariants = JSON.parse(data.variants || '[]') as Array<{ type: string; options: string[] }>
        setVariants(rawVariants.map(v => ({
          type: v.type,
          options: v.options.join(', ')
        })))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (productId) fetchProduct()
  }, [productId])

  function addImageUrl() {
    if (imageInput.trim() && images.length < 5) {
      setImages([...images, imageInput.trim()])
      setImageInput('')
    }
  }

  function addVariant() {
    setVariants([...variants, { type: 'size', options: 'S,M,L,XL' }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price || !form.category) {
      setError('Name, price, and category are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
          category: form.category,
          inventory_count: form.inventory_count ? parseInt(form.inventory_count) : 0,
          images,
          variants: variants.map(v => ({
            type: v.type,
            options: v.options.split(',').map(o => o.trim()).filter(Boolean),
          })),
          type: form.type,
          digital_content: form.digital_content,
          is_active: form.is_active,
        }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError((data.error as string) || 'Failed to update product')
        return
      }
      router.push('/dashboard/products')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
        <p className="text-sm text-muted-foreground font-medium">Loading product data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products" className="text-muted-foreground/70 hover:text-muted-foreground">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-black text-foreground">Edit Product</h1>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {form.is_active ? 'Active' : 'Hidden'}
            </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Product Details</h2>
            <button 
                type="button"
                onClick={() => setForm({ ...form, is_active: form.is_active ? 0 : 1})}
                className="text-[10px] font-black uppercase tracking-widest text-[#25D366] hover:underline"
            >
                {form.is_active ? 'Hide Product' : 'Show Product'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {(['physical', 'digital', 'service'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  form.type === t 
                    ? 'bg-white text-[#25D366] shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {form.type === 'digital' && (
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-black text-blue-700 uppercase tracking-widest">Digital Content (Link/Key)</label>
              <input
                type="text"
                value={form.digital_content}
                onChange={e => setForm({ ...form, digital_content: e.target.value })}
                className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
          )}

          {form.type === 'service' && (
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-black text-purple-700 uppercase tracking-widest">Service Instructions</label>
              <textarea
                value={form.digital_content}
                onChange={e => setForm({ ...form, digital_content: e.target.value })}
                rows={2}
                className="w-full border border-purple-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Name *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              maxLength={200} required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none"
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Price *</label>
              <input
                type="number" step="0.01" min="0" max="9999999999"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Compare at Price</label>
              <input
                type="number" step="0.01" min="0" max="9999999999"
                value={form.compare_at_price}
                onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Category *</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                maxLength={100} required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Inventory Count</label>
              <input
                type="number" min="0"
                value={form.inventory_count}
                onChange={e => setForm({ ...form, inventory_count: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Media & Gallery</h2>
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-black uppercase text-slate-400">Up to 5 Images</span>
          </div>

          {images.length > 0 ? (
            <div className="relative aspect-square w-full max-w-[200px] rounded-2xl overflow-hidden border-2 border-dashed border-primary/20 bg-slate-50 mx-auto group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0]} alt="Main Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-[10px] text-white font-black uppercase tracking-widest">Primary Image</p>
              </div>
            </div>
          ) : (
            <div className="aspect-square w-full max-w-[200px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 mx-auto flex flex-col items-center justify-center text-slate-300 gap-2">
               <Plus size={32} strokeWidth={1} />
               <p className="text-[10px] font-black uppercase tracking-widest">No Image Added</p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
              placeholder="Paste image link (https://...)"
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-slate-50 font-medium"
            />
            <button type="button" onClick={addImageUrl}
              className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:scale-[1.02] transition-transform">
              Add
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Variants <span className="text-muted-foreground/70 font-normal text-sm">(size, color, etc.)</span></h2>
            <button type="button" onClick={addVariant}
              className="text-sm text-[#25D366] font-semibold hover:underline">
              + Add Variant
            </button>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={v.type}
                onChange={e => setVariants(variants.map((vv, j) => j === i ? { ...vv, type: e.target.value } : vv))}
                className="border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={v.options}
                  onChange={e => setVariants(variants.map((vv, j) => j === i ? { ...vv, options: e.target.value } : vv))}
                  className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
                <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>
                  <Trash2 size={14} className="text-red-400 hover:text-red-600 mt-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard/products"
            className="flex-1 text-center bg-secondary/50 text-muted-foreground py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

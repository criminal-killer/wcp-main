'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ProductVariant {
  type: string
  options: Array<{ name: string; price: string }>
}

interface ProductFormData {
  name: string
  description: string
  price: string
  compare_at_price: string
  category: string
  sub_category: string
  inventory_count: string
}

interface ProductData {
  id?: string
  name: string
  description?: string
  price: number
  compare_at_price?: number
  category: string
  sub_category?: string
  inventory_count: number
  images: string[]
  variants: Array<{ type: string; options: Array<{ name: string; price?: number }> }>
}

export default function ProductFormPage({ isEdit = false }: { isEdit?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [productId, setProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    sub_category: '',
    inventory_count: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
const [variants, setVariants] = useState<ProductVariant[]>([])

  useEffect(() => {
    if (isEdit) {
      const id = window.location.pathname.split('/').pop()
      if (id) {
        setProductId(id)
        fetch(`/api/products/${id}`)
          .then(r => r.json())
          .then(data => {
            if (data.data) {
              const p: ProductData = data.data
              setForm({
                name: p.name || '',
                description: p.description || '',
                price: String(p.price || ''),
                compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
                category: p.category || '',
                sub_category: p.sub_category || '',
                inventory_count: String(p.inventory_count || 0),
              })
              try {
                setImages(JSON.parse(String(p.images || '[]')) as string[])
              } catch { setImages([]) }
              try {
                const parsed = JSON.parse(String(p.variants || '[]')) as any[]
                setVariants(parsed.map((v: any) => ({
                  type: v.type,
                  options: v.options.map((o: any) => ({ name: o.name, price: o.price ? String(o.price) : '' })),
                })))
              } catch { setVariants([]) }
            }
          })
          .catch(() => setError('Failed to load product'))
          .finally(() => setFetching(false))
      }
    }
  }, [isEdit])

  function addImageUrl() {
    if (imageInput.trim() && images.length < 5) {
      setImages([...images, imageInput.trim()])
      setImageInput('')
    }
  }

  function addVariant() {
    setVariants([...variants, { type: 'size', options: [{ name: 'S', price: '' }, { name: 'M', price: '' }, { name: 'L', price: '' }, { name: 'XL', price: '' }] }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price || !form.category) {
      setError('Name, price, and category are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : undefined,
        category: form.category,
        sub_category: form.sub_category || undefined,
        inventory_count: form.inventory_count ? parseInt(form.inventory_count) : 0,
        images,
        variants: variants.map(v => ({
          type: v.type,
          options: v.options.filter(o => o.name.trim()).map(o => ({
            name: o.name.trim(),
            price: o.price ? parseFloat(o.price) : undefined,
          })),
        })),
      }

      const res = await fetch(isEdit && productId ? `/api/products/${productId}` : '/api/products', {
        method: isEdit && productId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError((data.error as string) || 'Failed to save product')
        return
      }
      router.push('/dashboard/products')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="text-muted-foreground/70 hover:text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black text-foreground">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground">Product Details</h2>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Name *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Blue Cotton T-Shirt"
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
              placeholder="Product description..."
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Price *</label>
              <input
                type="number" step="0.01" min="0" max="9999999999"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="1000000.00"
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
                placeholder="1200000.00 (optional)"
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
                placeholder="e.g. Clothing"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                maxLength={100} required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Sub-Category</label>
              <input
                type="text"
                value={form.sub_category}
                onChange={e => setForm({ ...form, sub_category: e.target.value })}
                placeholder="e.g. Shorts, Trousers"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Inventory Count</label>
            <input
              type="number" min="0"
              value={form.inventory_count}
              onChange={e => setForm({ ...form, inventory_count: e.target.value })}
              placeholder="0"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] max-w-[200px]"
            />
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
                {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center font-black uppercase py-0.5">Main</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground">Variants <span className="text-muted-foreground/70 font-normal text-sm">(size, color, ports, etc.)</span></h2>
              <p className="text-xs text-muted-foreground mt-1">Add optional price per variant (e.g., 8-port switch costs more than 4-port)</p>
            </div>
            <button type="button" onClick={addVariant}
              className="text-sm text-[#25D366] font-semibold hover:underline">
              + Add Variant
            </button>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.type}
                  onChange={e => setVariants(variants.map((vv, j) => j === i ? { ...vv, type: e.target.value } : vv))}
                  placeholder="Variant type (e.g. ports, size, color)"
                  className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
                <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>
                  <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Options (leave price empty to use base price)</p>
                {v.options.map((opt, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.name}
                      onChange={e => setVariants(variants.map((vv, j) => j === i ? { ...vv, options: vv.options.map((o, l) => l === k ? { ...o, name: e.target.value } : o) } : vv))}
                      placeholder="Option name"
                      className="flex-1 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={opt.price}
                      onChange={e => setVariants(variants.map((vv, j) => j === i ? { ...vv, options: vv.options.map((o, l) => l === k ? { ...o, price: e.target.value } : o) } : vv))}
                      placeholder="Price"
                      className="w-28 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                    <button type="button" onClick={() => setVariants(variants.map((vv, j) => j === i ? { ...vv, options: vv.options.filter((_, l) => l !== k) } : vv))}>
                      <Trash2 size={12} className="text-red-300 hover:text-red-500" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setVariants(variants.map((vv, j) => j === i ? { ...vv, options: [...vv.options, { name: '', price: '' }] } : vv))}
                  className="text-xs text-[#25D366] font-semibold hover:underline"
                >
                  + Add option
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
            disabled={loading}
            className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Save Product')}
          </button>
        </div>
      </form>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category: '',
    inventory_count: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  const [variants, setVariants] = useState<Array<{ type: string; options: string }>>([])

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
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : undefined,
          category: form.category,
          inventory_count: form.inventory_count ? parseInt(form.inventory_count) : 0,
          images,
          variants: variants.map(v => ({
            type: v.type,
            options: v.options.split(',').map(o => o.trim()).filter(Boolean),
          })),
        }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError((data.error as string) || 'Failed to create product')
        return
      }
      router.push('/dashboard/products')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Product Details</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Blue Cotton T-Shirt"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              maxLength={200} required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the product..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none"
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="1500.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Compare at Price</label>
              <input
                type="number" step="0.01" min="0"
                value={form.compare_at_price}
                onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                placeholder="2000.00 (optional)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Clothing"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                maxLength={100} required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Inventory Count</label>
              <input
                type="number" min="0"
                value={form.inventory_count}
                onChange={e => setForm({ ...form, inventory_count: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h2 className="font-bold text-gray-900">Images <span className="text-gray-400 font-normal text-sm">(up to 5)</span></h2>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <button type="button" onClick={addImageUrl}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Plus size={16} />
            </button>
          </div>
          {images.map((url, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Preview" className="w-8 h-8 object-cover rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />
              <span className="flex-1 text-sm text-gray-600 truncate">{url}</span>
              <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}>
                <Trash2 size={14} className="text-red-400 hover:text-red-600" />
              </button>
            </div>
          ))}
        </div>

        {/* Variants */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Variants <span className="text-gray-400 font-normal text-sm">(size, color, etc.)</span></h2>
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
                placeholder="Type (e.g. size)"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={v.options}
                  onChange={e => setVariants(variants.map((vv, j) => j === i ? { ...vv, options: e.target.value } : vv))}
                  placeholder="Options (comma separated)"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
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
            className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, MessageCircle, Check, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  images: string
  variant?: string
}

type CheckoutResult = {
  orderNumber: string
  total: number
  currency: string
  whatsappLink: string
}

export default function CheckoutPage() {
  const params = useParams()
  const slug = params.slug as string
  const [cart, setCart] = useState<CartItem[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [error, setError] = useState('')
  const [orgCurrency, setOrgCurrency] = useState('KES')

  useEffect(() => {
    fetch(`/api/store/${slug}`).then(r => r.json()).then(d => {
      if (d.currency) setOrgCurrency(d.currency)
    }).catch(() => {})
    try {
      const raw = localStorage.getItem('store_cart')
      setCart(raw ? JSON.parse(raw) : [])
    } catch { setCart([]) }
  }, [slug])

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total = subtotal

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-1">Order: <span className="font-mono font-semibold text-gray-900">{result.orderNumber}</span></p>
        <p className="text-gray-500 mb-8">Total: <span className="font-semibold text-gray-900">{result.currency} {result.total.toLocaleString()}</span></p>

        <a
          href={result.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          <MessageCircle size={24} />
          Complete Payment on WhatsApp
        </a>
        <p className="text-xs text-gray-400 mt-4">
          After payment, send &quot;paid&quot; in WhatsApp to confirm.
        </p>
        <Link
          href={`/store/${slug}`}
          className="block mt-6 text-sm text-gray-500 hover:text-emerald-600 underline"
        >
          Back to store
        </Link>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link href={`/store/${slug}`} className="text-emerald-600 hover:underline">Start shopping</Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) { setError('Phone number is required'); return }
    if (!name.trim()) { setError('Name is required'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/store/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, phone: phone.trim(), name: name.trim(), address: address.trim(), notes: notes.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Checkout failed'); setSubmitting(false); return }

      localStorage.removeItem('store_cart')
      window.dispatchEvent(new Event('cart-update'))
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href={`/store/${slug}/cart`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to cart
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
        {cart.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex justify-between text-sm py-1.5">
            <span className="text-gray-600">{item.name} x{item.qty}</span>
            <span className="font-medium text-gray-900">{orgCurrency} {(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>{orgCurrency} {total.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="Your name" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp Number *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} required type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="e.g. 254712345678" />
          <p className="text-xs text-gray-400 mt-1">We'll send your order confirmation here</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Address</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
            placeholder="Your delivery address (optional)" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
            placeholder="Any special instructions? (optional)" />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">{error}</div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <>Place Order via WhatsApp</>}
        </button>

        <p className="text-xs text-gray-400 text-center">
          After placing your order, you'll receive a WhatsApp link to complete payment.
        </p>
      </form>
    </div>
  )
}

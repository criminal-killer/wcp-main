'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useParams } from 'next/navigation'

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  images: string
  variant?: string
}

export default function CartPage() {
  const params = useParams()
  const slug = params.slug as string
  const [cart, setCart] = useState<CartItem[]>([])
  const [orgCurrency, setOrgCurrency] = useState('KES')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletedId, setDeletedId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/store/${slug}`).then(r => r.json()),
    ]).then(([storeData]) => {
      if (storeData.currency) setOrgCurrency(storeData.currency)
      if (storeData.delivery_fee) setDeliveryFee(storeData.delivery_fee)
      if (storeData.free_delivery_above) setFreeDeliveryAbove(storeData.free_delivery_above)
      setLoading(false)
    }).catch(() => setLoading(false))

    updateCart()
    window.addEventListener('cart-update', updateCart)
    return () => window.removeEventListener('cart-update', updateCart)
  }, [slug])

  function updateCart() {
    try {
      const raw = localStorage.getItem('store_cart')
      setCart(raw ? JSON.parse(raw) : [])
    } catch { setCart([]) }
  }

  function saveCart(newCart: CartItem[]) {
    localStorage.setItem('store_cart', JSON.stringify(newCart))
    setCart(newCart)
    window.dispatchEvent(new Event('cart-update'))
  }

  function updateQty(index: number, delta: number) {
    const newCart = [...cart]
    newCart[index].qty = Math.max(1, newCart[index].qty + delta)
    saveCart(newCart)
  }

  function removeItem(index: number) {
    const item = cart[index]
    setDeletedId(`${item.id}-${item.variant || ''}-${Date.now()}`)
    const newCart = cart.filter((_, i) => i !== index)
    saveCart(newCart)
    setTimeout(() => setDeletedId(null), 300)
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const finalDelivery = subtotal >= freeDeliveryAbove && freeDeliveryAbove > 0 ? 0 : deliveryFee
  const total = subtotal + finalDelivery

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Loading cart...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/store/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
        <ArrowLeft size={16} />
        Continue shopping
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link href={`/store/${slug}`} className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.map((item, idx) => {
              const images = (() => { try { return JSON.parse(item.images) } catch { return [] } })()
              const uniqueKey = `${item.id}-${item.variant || ''}-${idx}`
              const isDeleting = deletedId?.startsWith(item.id) ?? false
              return (
                <div key={uniqueKey} className={`flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 transition-all duration-300 ${isDeleting ? 'opacity-0 scale-95' : ''}`}>
                  <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                    {images[0] ? (
                      <img src={images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{orgCurrency} {item.price.toLocaleString()}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={12} /></button>
                        <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{orgCurrency} {(item.price * item.qty).toLocaleString()}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{orgCurrency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>{finalDelivery === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `${orgCurrency} ${finalDelivery.toLocaleString()}`}</span>
            </div>
            {freeDeliveryAbove > 0 && subtotal < freeDeliveryAbove && (
              <p className="text-xs text-gray-400">Free delivery on orders over {orgCurrency} {freeDeliveryAbove.toLocaleString()}</p>
            )}
            <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{orgCurrency} {total.toLocaleString()}</span>
            </div>
          </div>

          <Link
            href={`/store/${slug}/checkout`}
            className="mt-6 block w-full bg-emerald-600 text-white text-center py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            Proceed to Checkout
          </Link>
        </>
      )}
    </div>
  )
}

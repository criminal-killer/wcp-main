'use client'

import { useState } from 'react'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'

type ProductData = {
  id: string
  name: string
  price: number
  images: string
}

type Variant = {
  type: string
  options: Array<{ name: string; price?: number }>
}

export default function ProductDetailClient({
  product, variants, orgCurrency, inStock, storeSlug,
}: {
  product: ProductData
  variants: Variant[]
  orgCurrency: string
  inStock: boolean
  storeSlug: string
}) {
  const [qty, setQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const variantPrice = selectedVariant
    ? variants[0]?.options.find(o => o.name === selectedVariant)?.price
    : undefined
  const effectivePrice = variantPrice ?? product.price

  const addToCart = () => {
    try {
      const raw = localStorage.getItem('store_cart')
      const cart = raw ? JSON.parse(raw) : []
      const cartItem = {
        id: product.id,
        name: selectedVariant ? `${product.name} (${selectedVariant})` : product.name,
        price: effectivePrice,
        qty,
        images: product.images,
        variant: selectedVariant,
      }
      const existing = cart.findIndex((i: any) => i.id === product.id && i.variant === selectedVariant)
      if (existing >= 0) {
        cart[existing].qty += qty
      } else {
        cart.push(cartItem)
      }
      localStorage.setItem('store_cart', JSON.stringify(cart))
      setAdded(true)
      window.dispatchEvent(new Event('cart-update'))
      setTimeout(() => setAdded(false), 2000)
    } catch {}
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Variants */}
      {variants.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{variants[0].type}</label>
          <div className="flex flex-wrap gap-2">
            {variants[0].options.map(opt => {
              const price = opt.price ?? product.price
              const isSelected = selectedVariant === opt.name
              return (
                <button
                  key={opt.name}
                  onClick={() => setSelectedVariant(opt.name)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {opt.name} — {orgCurrency} {price.toLocaleString()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="text-lg font-semibold w-8 text-center">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="text-lg">
        <span className="text-gray-500">Total: </span>
        <span className="font-bold text-gray-900">{orgCurrency} {(effectivePrice * qty).toLocaleString()}</span>
      </div>

      {/* Add to Cart */}
      {inStock && (
        <button
          onClick={addToCart}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            added
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
          }`}
        >
          {added ? <><Check size={22} /> Added to Cart</> : <><ShoppingCart size={22} /> Add to Cart</>}
        </button>
      )}

      {/* View Cart */}
      <Link
        href={`/store/${storeSlug}/cart`}
        className="block w-full text-center py-3 rounded-2xl font-semibold border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors"
      >
        View Cart
      </Link>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'

type CartProduct = {
  id: string
  name: string
  price: number
  images: string
}

export default function AddToCartButton({ product, orgCurrency }: { product: CartProduct; orgCurrency: string }) {
  const [added, setAdded] = useState(false)

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const raw = localStorage.getItem('store_cart')
      const cart = raw ? JSON.parse(raw) : []
      const existing = cart.findIndex((i: any) => i.id === product.id)
      if (existing >= 0) {
        cart[existing].qty += 1
      } else {
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, images: product.images })
      }
      localStorage.setItem('store_cart', JSON.stringify(cart))
      setAdded(true)
      window.dispatchEvent(new Event('cart-update'))
      setTimeout(() => setAdded(false), 1500)
    } catch {}
  }

  return (
    <button
      onClick={addToCart}
      className={`mt-2 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
        added
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-gray-100 text-gray-700 hover:bg-emerald-600 hover:text-white'
      }`}
    >
      {added ? (
        <><Check size={14} /> Added</>
      ) : (
        <><ShoppingCart size={14} /> Add to Cart</>
      )}
    </button>
  )
}

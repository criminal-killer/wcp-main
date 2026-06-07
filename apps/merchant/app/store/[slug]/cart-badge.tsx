'use client'

import { useState, useEffect } from 'react'

export default function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem('store_cart')
        if (raw) {
          const items = JSON.parse(raw)
          setCount(items.reduce((s: number, i: any) => s + (i.qty || 0), 0))
        } else {
          setCount(0)
        }
      } catch { setCount(0) }
    }
    update()
    window.addEventListener('storage', update)
    window.addEventListener('cart-update', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('cart-update', update)
    }
  }, [])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  )
}

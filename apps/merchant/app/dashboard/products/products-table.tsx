'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  currency: string
  category: string | null
  inventory_count: number | null
  is_active: number | null
  images: string | null
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  const filtered = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#25D366]"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat || ''}>{cat}</option>
          ))}
        </select>
      </div>

      <table className="w-full">
        <thead className="bg-secondary border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="text-left px-5 py-3">Product</th>
            <th className="text-left px-5 py-3">Category</th>
            <th className="text-left px-5 py-3">Price</th>
            <th className="text-left px-5 py-3">Inventory</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-right px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                {search || categoryFilter ? 'No products match your filters' : 'No products yet'}
              </td>
            </tr>
          ) : (
            filtered.map((product) => {
              const images = JSON.parse(product.images || '[]') as string[]
              return (
                <tr key={product.id} className="hover:bg-secondary transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/50 rounded-xl flex-shrink-0 overflow-hidden">
                        {images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="w-full h-full text-gray-300 p-2.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground/70 truncate">{product.description?.slice(0, 40)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{product.category}</td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-semibold text-foreground">
                      {product.currency} {product.price.toLocaleString()}
                    </div>
                    {product.compare_at_price && (
                      <div className="text-xs text-muted-foreground/70 line-through">
                        {product.currency} {product.compare_at_price.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium ${(product.inventory_count || 0) === 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {product.inventory_count === 0 ? '⚠️ Out of Stock' : `${product.inventory_count} in stock`}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      product.is_active ? 'bg-green-100 text-green-700' : 'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-sm text-[#25D366] font-medium hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

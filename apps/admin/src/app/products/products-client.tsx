'use client'

import { useState } from 'react'
import { Search, Store, ShoppingBag, Package } from 'lucide-react'

type Product = {
  id: string
  org_id: string
  name: string
  description: string | null
  price: number
  currency: string | null
  category: string | null
  product_type: string | null
  inventory_count: number | null
  is_active: number | null
  created_at: string | null
  org_name: string | null
}

export function ProductsClient({ initialData }: { initialData: Product[] }) {
  const [products, setProducts] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Get unique org names and categories for filters
  const orgs = Array.from(new Set(products.map(p => p.org_name).filter(Boolean) as string[]))
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))

  const filtered = products.filter(p => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !searchTerm ||
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.org_name || '').toLowerCase().includes(q)
    const matchOrg = !orgFilter || p.org_name === orgFilter
    const matchCategory = !categoryFilter || p.category === categoryFilter
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' && p.is_active === 1) ||
      (statusFilter === 'inactive' && p.is_active !== 1)
    return matchSearch && matchOrg && matchCategory && matchStatus
  })

  async function handleToggle(productId: string, currentActive: number | null) {
    setLoadingId(productId)
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, action: currentActive === 1 ? 'deactivate' : 'activate' }),
      })
      if (res.ok) {
        setProducts(products.map(p => p.id === productId ? { ...p, is_active: currentActive === 1 ? 0 : 1 } : p))
      }
    } catch { /* ignore */ }
    setLoadingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none">
          <option value="">All Stores</option>
          {orgs.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs font-bold text-slate-400">{filtered.length} products</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Store</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-all">
                <td className="p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{product.name}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{product.description || product.product_type || '-'}</p>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-xs font-bold text-slate-600">{product.org_name}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm font-bold text-slate-700">{product.currency || 'USD'} {product.price}</p>
                </td>
                <td className="p-4">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                    {product.category || '-'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold ${
                    (product.inventory_count ?? 0) === 0 ? 'text-red-500' :
                    (product.inventory_count ?? 0) < 5 ? 'text-amber-500' :
                    'text-slate-600'
                  }`}>
                    {product.inventory_count ?? 'Unlimited'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                    product.is_active === 1
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {product.is_active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggle(product.id, product.is_active)}
                    disabled={loadingId === product.id}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                      product.is_active === 1
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {product.is_active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center">
            <Package size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}

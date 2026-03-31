import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, products } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const productList = await db.select()
    .from(products)
    .where(and(eq(products.org_id, user.org_id)))
    .orderBy(desc(products.created_at))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">{productList.length} products · Up to 200</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {productList.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-bold text-muted-foreground text-lg mb-2">No products yet</h3>
          <p className="text-muted-foreground/70 mb-6">Add your first product and it will appear in your WhatsApp store automatically.</p>
          <Link href="/dashboard/products/new" className="bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
            Add Your First Product →
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <select className="border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#25D366]">
              <option value="">All Categories</option>
              {[...new Set(productList.map(p => p.category).filter(Boolean))].map(cat => (
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
              {productList.map((product) => {
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
                        {product.inventory_count === 0 ? 'Out of Stock' : `${product.inventory_count} in stock`}
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
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

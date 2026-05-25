import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, products } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import ProductsTable from './products-table'

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
        <ProductsTable products={productList} />
      )}
    </div>
  )
}

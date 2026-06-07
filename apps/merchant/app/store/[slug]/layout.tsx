import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Store } from 'lucide-react'
import { getStoreBySlug } from '@/lib/storefront'
import CartBadge from './cart-badge'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const org = await getStoreBySlug(params.slug)
  if (!org) return { title: 'Store Not Found' }
  return {
    title: org.name,
    description: org.description || `Shop at ${org.name}`,
  }
}

export default async function StoreLayout({
  children, params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const org = await getStoreBySlug(params.slug)
  if (!org) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.com'
  const storeUrl = `${baseUrl}/store/${org.slug}`

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/store/${org.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <Store size={20} className="text-emerald-600" />
            )}
            <span className="font-bold text-lg text-gray-900">{org.name}</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href={`/store/${org.slug}/cart`}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart size={22} />
              <CartBadge />
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t bg-gray-50 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {org.name}. All rights reserved.</p>
          <p className="mt-1">Powered by Chatevo</p>
        </div>
      </footer>
    </div>
  )
}

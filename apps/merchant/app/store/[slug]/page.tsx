import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Search } from 'lucide-react'
import { getStoreBySlug, getStoreProducts, getStoreCategories } from '@/lib/storefront'
import AddToCartButton from './add-to-cart-button'

function parseImages(images: string): string[] {
  try { return JSON.parse(images) } catch { return [] }
}

export default async function StoreHome({ params, searchParams }: {
  params: { slug: string }
  searchParams: { category?: string; q?: string }
}) {
  const org = await getStoreBySlug(params.slug)
  if (!org) notFound()

  const products = await getStoreProducts(org.id, {
    category: searchParams.category,
    search: searchParams.q,
  })
  const categories = await getStoreCategories(org.id)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.com'
  const waNumber = org.wa_bot_number || ''

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
          {org.name}
        </h1>
        {org.description && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{org.description}</p>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            defaultValue={searchParams.q || ''}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/store/${org.slug}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!searchParams.category ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </Link>
          {categories.slice(0, 8).map(cat => (
            <Link
              key={cat}
              href={`/store/${org.slug}?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${searchParams.category === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No products found.</p>
          {!searchParams.q && !searchParams.category && (
            <Link href={`/store/${org.slug}/request`} className="text-emerald-600 hover:underline mt-2 inline-block">
              Request what you need
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => {
            const images = parseImages(product.images)
            return (
              <div key={product.id} className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all overflow-hidden">
                <Link href={`/store/${org.slug}/product/${product.id}`}>
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {images[0] ? (
                      <img src={images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3 md:p-4">
                  <Link href={`/store/${org.slug}/product/${product.id}`}>
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 hover:text-emerald-700 transition-colors">{product.name}</h3>
                  </Link>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-bold text-lg text-gray-900">{org.currency || 'KES'} {product.price.toLocaleString()}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-sm text-gray-400 line-through">{org.currency || 'KES'} {product.compare_at_price.toLocaleString()}</span>
                    )}
                  </div>
                  <AddToCartButton product={product} orgCurrency={org.currency || 'KES'} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* WhatsApp CTA */}
      {waNumber && (
        <div className="mt-16 text-center">
          <a
            href={`https://wa.me/${waNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <MessageCircle size={20} />
            Chat with us on WhatsApp
          </a>
        </div>
      )}

      {/* Request Item */}
      <div className="mt-8 text-center">
        <Link
          href={`/store/${org.slug}/request`}
          className="text-sm text-gray-500 hover:text-emerald-600 underline transition-colors"
        >
          Don&apos;t see what you&apos;re looking for? Request it
        </Link>
      </div>
    </div>
  )
}

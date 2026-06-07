import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { getStoreBySlug, getStoreProductById } from '@/lib/storefront'
import ProductDetailClient from './product-detail-client'

function parseImages(images: string): string[] {
  try { return JSON.parse(images) } catch { return [] }
}

function parseVariants(variants: string): Array<{ type: string; options: Array<{ name: string; price?: number }> }> {
  try { return JSON.parse(variants) } catch { return [] }
}

export default async function ProductPage({ params }: { params: { slug: string; id: string } }) {
  const org = await getStoreBySlug(params.slug)
  if (!org) notFound()

  const product = await getStoreProductById(org.id, params.id)
  if (!product) notFound()

  const images = parseImages(product.images)
  const variants = parseVariants(product.variants)
  const inStock = (product.inventory_count ?? 0) > 0 || product.product_type === 'digital'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href={`/store/${org.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to store
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
          {images[0] ? (
            <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={64} />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link
              href={`/store/${org.slug}?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-semibold uppercase tracking-wider text-emerald-600 hover:text-emerald-700"
            >
              {product.category}{product.sub_category ? ` / ${product.sub_category}` : ''}
            </Link>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {org.currency || 'KES'} {product.price.toLocaleString()}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xl text-gray-400 line-through">
                {org.currency || 'KES'} {product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-2">
            {inStock ? (
              <span className="text-sm text-emerald-600 font-medium">
                {product.product_type === 'digital' ? 'Instant delivery' : `${product.inventory_count} in stock`}
              </span>
            ) : (
              <span className="text-sm text-red-500 font-medium">Out of stock</span>
            )}
          </div>

          {product.description && (
            <div className="mt-6 text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {product.product_type === 'digital' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
              Digital product — delivered instantly after payment
            </div>
          )}

          {product.product_type === 'service' && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl text-sm text-purple-700">
              {product.service_duration ? `Service duration: ${product.service_duration}` : 'Service — we will contact you to schedule'}
            </div>
          )}

          <ProductDetailClient
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              images: product.images,
            }}
            variants={variants}
            orgCurrency={org.currency || 'KES'}
            inStock={inStock}
            storeSlug={org.slug}
          />
        </div>
      </div>
    </div>
  )
}

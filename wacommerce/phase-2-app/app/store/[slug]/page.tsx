import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.slug, params.slug) })
  if (!org) return { title: 'Store Not Found' }
  return {
    title: `${org.name} — WhatsApp Store`,
    description: org.description || `Shop at ${org.name} via WhatsApp`,
    openGraph: { title: org.name, description: org.description || '' },
  }
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, params.slug),
  })

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-300 mb-4">404</h1>
          <p className="text-gray-500">Store not found</p>
          <Link href="/" className="mt-4 inline-block text-[#25D366] underline">Go Home</Link>
        </div>
      </div>
    )
  }

  const productList = await db.select()
    .from(products)
    .where(and(eq(products.org_id, org.id), eq(products.is_active, 1)))
    .limit(200)

  const categories = [...new Set(productList.map(p => p.category).filter(Boolean))] as string[]
  const themeColor = org.theme_color || '#25D366'

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#111B21] relative font-outfit" style={{ '--theme': themeColor } as React.CSSProperties}>
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: themeColor }}>
                {org.name[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-serif font-black text-[#075E54] text-xl tracking-tight leading-none">{org.name}</h1>
              {org.description && <p className="text-[10px] text-muted-foreground hidden sm:block font-bold uppercase tracking-widest mt-1">{org.description}</p>}
            </div>
          </div>
          <a
            href={`https://wa.me/${org.wa_phone_number_id?.replace(/\D/g, '') || ''}?text=Hi`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: themeColor }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat & Order
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center py-12 mb-8">
          <h2 className="text-4xl md:text-6xl font-serif font-black mb-4 tracking-tight text-[#075E54]">
            Exclusive <span className="text-primary italic">Catalogue</span>
          </h2>
          <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Browse our curated collection. Click &quot;Chat &amp; Order&quot; to finalize your purchase via WhatsApp.
          </p>
        </div>

        {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            <button className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: themeColor }}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap">
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {productList.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="font-bold text-gray-600 text-lg">No products yet</h3>
            <p className="text-gray-400">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {productList.map(product => {
              const images = JSON.parse(product.images || '[]') as string[]
              const discount = product.compare_at_price
                ? Math.round((1 - product.price / product.compare_at_price) * 100)
                : null
 
              return (
                <div key={product.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group">
                  {/* Image */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden">
                    {images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                    )}
                    {discount && (
                      <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                        -{discount}% OFF
                      </span>
                    )}
                    {product.inventory_count === 0 && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-[#111B21] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">Out of Stock</span>
                      </div>
                    )}
                  </div>
 
                  {/* Info */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-serif font-black text-[#075E54] text-lg line-clamp-1 tracking-tight">{product.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-primary text-xl">{org.currency} {product.price.toLocaleString()}</span>
                      {product.compare_at_price && (
                        <span className="text-xs text-muted-foreground line-through font-bold opacity-50">{org.currency} {product.compare_at_price.toLocaleString()}</span>
                      )}
                    </div>
                    <a
                      href={`https://wa.me/${org.wa_phone_number_id?.replace(/\D/g, '') || ''}?text=Hi, I want to order: ${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full text-white text-xs font-black py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/10 uppercase tracking-widest"
                      style={{ background: product.inventory_count === 0 ? '#cbd5e1' : themeColor, pointerEvents: product.inventory_count === 0 ? 'none' : 'auto' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {product.inventory_count === 0 ? 'Out of Stock' : 'Order via WhatsApp'}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border/20 mt-20 py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
        <p>{org.name} · Curated with <Link href="/" className="text-primary hover:underline">SELLA</Link></p>
      </footer>
    </div>
  )
}

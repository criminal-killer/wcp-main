import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations, stores } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { PLAN_CONFIG, normalizePlan } from '@/lib/payments'
import Link from 'next/link'
import { Store, Plus, Globe, Phone, Settings, ChevronRight } from 'lucide-react'

export default async function StoresPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })
  if (!org) redirect('/onboarding')

  const storeList = await db.select().from(stores)
    .where(and(eq(stores.org_id, user.org_id!), eq(stores.is_active, 1)))
    .orderBy(stores.created_at)

  const plan = normalizePlan(org.plan || 'starter')
  const storeLimit = PLAN_CONFIG[plan].store_limit
  const canCreateMore = storeList.length < storeLimit

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Stores</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {storeList.length} of {storeLimit} stores used ({PLAN_CONFIG[plan].name} plan)
          </p>
        </div>
        {canCreateMore && (
          <Link
            href="/dashboard/stores/new"
            className="flex items-center gap-2 bg-whatsapp text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-lg shadow-whatsapp/20"
          >
            <Plus size={16} />
            New Store
          </Link>
        )}
      </div>

      {/* Store limit bar */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-muted-foreground uppercase tracking-widest">Storage</span>
          <span className="text-foreground">{storeList.length} / {storeLimit}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-whatsapp rounded-full transition-all"
            style={{ width: `${Math.min(100, (storeList.length / storeLimit) * 100)}%` }}
          />
        </div>
        {!canCreateMore && (
          <p className="text-xs text-muted-foreground mt-2">
            Upgrade your plan to create more stores.{' '}
            <Link href="/dashboard/settings?tab=billing" className="text-whatsapp font-bold hover:underline">
              Upgrade now
            </Link>
          </p>
        )}
      </div>

      {/* Store list */}
      <div className="space-y-3">
        {storeList.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Store size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-bold text-foreground">No stores yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first store to get started</p>
            {canCreateMore && (
              <Link
                href="/dashboard/stores/new"
                className="inline-flex items-center gap-2 mt-4 bg-whatsapp text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-all"
              >
                <Plus size={16} /> Create Store
              </Link>
            )}
          </div>
        ) : (
          storeList.map(store => (
            <Link
              key={store.id}
              href={`/dashboard/stores/${store.id}`}
              className="block bg-card rounded-2xl border border-border p-5 hover:border-whatsapp/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    store.is_default === 1 ? 'bg-whatsapp/10 text-whatsapp' : 'bg-secondary text-muted-foreground'
                  }`}>
                    <Store size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{store.name}</p>
                      {store.is_default === 1 && (
                        <span className="text-[9px] font-black bg-whatsapp/10 text-whatsapp px-2 py-0.5 rounded-full uppercase tracking-widest">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {store.wa_phone_number_id ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          <Phone size={10} /> WhatsApp Connected
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 font-medium">WhatsApp not connected</span>
                      )}
                      <span className="text-xs text-muted-foreground capitalize">{store.store_type || 'physical'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`/store/${store.slug}`}
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    className="p-2 text-muted-foreground hover:text-whatsapp transition-colors"
                    title="View store"
                  >
                    <Globe size={18} />
                  </a>
                  <ChevronRight size={18} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
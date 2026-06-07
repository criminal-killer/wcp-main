import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { users, organizations, notifications, products, stores } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import DashboardSidebar from './sidebar'
import { Clock } from 'lucide-react'
import AiAssist from '@/components/dashboard/AiAssist'

type SetupItem = {
  title: string
  message: string
  action_url: string
  is_done: boolean
  type: 'warning' | 'info'
}

function getSetupItems(org: typeof organizations.$inferSelect, productCount: number): SetupItem[] {
  return [
    {
      title: 'Add WhatsApp Phone ID',
      message: 'Connect your WhatsApp Business API by adding the Phone ID from Meta Developer Console.',
      action_url: '/dashboard/settings?tab=whatsapp',
      is_done: !!org.wa_phone_number_id,
      type: 'warning',
    },
    {
      title: 'Set your Bot Number',
      message: 'Add the WhatsApp number customers will message so your storefront links work.',
      action_url: '/dashboard/settings?tab=whatsapp',
      is_done: !!org.wa_bot_number,
      type: 'warning',
    },
    {
      title: 'Verify Webhook',
      message: 'Verify your webhook in Meta Developer Console to start receiving messages.',
      action_url: '/dashboard/settings?tab=whatsapp',
      is_done: !!org.wa_webhook_verified,
      type: 'warning',
    },
    {
      title: 'Add Products',
      message: 'Add at least one product to your store so customers can browse and order.',
      action_url: '/dashboard/products',
      is_done: productCount > 0,
      type: 'info',
    },
    {
      title: 'Configure Payment Methods',
      message: 'Enable payment methods so customers can pay for their orders.',
      action_url: '/dashboard/settings?tab=payments',
      is_done: !!org.payment_methods && org.payment_methods !== '[]',
      type: 'info',
    },
  ]
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })
  if (!org) redirect('/onboarding')

  // Fetch stores for switcher
  const storeList = await db.select().from(stores)
    .where(and(eq(stores.org_id, user.org_id!), eq(stores.is_active, 1)))
    .orderBy(stores.created_at)

  // Count products
  const productRows = await db.select({ id: products.id })
    .from(products)
    .where(and(eq(products.org_id, user.org_id!), eq(products.is_active, 1)))
    .limit(1)
  const productCount = productRows.length

  // Sync setup notifications
  const setupItems = getSetupItems(org, productCount)
  for (const item of setupItems) {
    const existing = await db.select({ id: notifications.id, is_read: notifications.is_read })
      .from(notifications)
      .where(and(eq(notifications.org_id, user.org_id!), eq(notifications.title, item.title)))
      .limit(1)

    if (item.is_done) {
      // Mark as read if exists and unread
      if (existing.length > 0 && existing[0].is_read === 0) {
        await db.update(notifications)
          .set({ is_read: 1 })
          .where(eq(notifications.id, existing[0].id))
      }
    } else {
      // Create if not exists
      if (existing.length === 0) {
        await db.insert(notifications).values({
          org_id: user.org_id!,
          title: item.title,
          message: item.message,
          type: item.type,
          action_url: item.action_url,
        })
      }
    }
  }

  // Unread notification count
  const unreadRows = await db.select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.org_id, user.org_id!), eq(notifications.is_read, 0)))
  const unreadCount = unreadRows.length

  // Check trial
  const trialDaysLeft = org.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0
  const isOnTrial = org.plan === 'trial' && trialDaysLeft > 0

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <DashboardSidebar org={org} stores={storeList} unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {isOnTrial && (
          <div className="bg-[#FFF4E5] border-b border-[#FFE2C2] px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <p className="text-amber-900 text-sm font-bold uppercase tracking-wider">
                {trialDaysLeft} days remaining in trial
              </p>
            </div>
            <Link
              href="/dashboard/settings?tab=billing"
              className="text-sm bg-amber-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Subscribe — $29/mo
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 md:p-6 relative">
          {children}
        </main>
        <AiAssist />
      </div>
    </div>
  )
}

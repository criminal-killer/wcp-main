import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations, auto_replies } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import SettingsClient from './settings-client'

export const dynamic = 'force-dynamic'

// Matches the Org interface in settings-client.tsx
type OrgShape = {
  name: string
  slug: string
  description: string | null
  theme_color: string | null
  currency: string | null
  wa_phone_number_id: string | null
  store_paypal_email: string | null
  store_cod_enabled: number | null
  whatsapp_verified: number | null
  wa_webhook_verified: number | null
  plan: string | null
  trial_ends_at: string | null
  [key: string]: unknown
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })
  if (!org) redirect('/onboarding')

  const replies = await db.select()
    .from(auto_replies)
    .where(eq(auto_replies.org_id, user.org_id))

  return <SettingsClient org={org as unknown as OrgShape} autoReplies={replies} />
}


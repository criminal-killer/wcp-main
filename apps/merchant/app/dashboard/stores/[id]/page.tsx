import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations, stores } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import StoreSettings from './store-settings'

export default async function StoreDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, params.id), eq(stores.org_id, user.org_id!)),
  })
  if (!store) notFound()

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id!),
  })

  return <StoreSettings store={store} org={org} />
}
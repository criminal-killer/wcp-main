import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export default async function MyStorePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Get user + org
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) {
    // No user record yet - send to onboarding
    redirect('/onboarding')
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })

  if (!org || !org.slug) {
    // User exists but no org created yet - send to onboarding
    redirect('/onboarding')
  }

  // Org exists - go to their live store
  redirect(`/store/${org.slug}`)
}
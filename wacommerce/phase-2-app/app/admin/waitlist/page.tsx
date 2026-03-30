import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import WaitlistClient from './waitlist-client'

export default async function AdminWaitlistPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Verify Super Admin
  const user = await db.query.users.findFirst({
    where: and(eq(users.clerk_id, userId), eq(users.is_super_admin, 1))
  })

  // If not super admin, redirect to normal dashboard
  if (!user) redirect('/dashboard')

  // Get all waitlisted organizations
  const waitlistedOrgs = await db.query.organizations.findMany({
    where: eq(organizations.is_waitlisted, 1),
    orderBy: (org, { desc }) => [desc(org.created_at)]
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Management</h1>
            <p className="text-gray-500 font-medium">Activate waitlisted businesses from around the world.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 border border-gray-100 rounded-2xl shadow-sm px-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">{waitlistedOrgs.length} Pending Approval</span>
          </div>
        </header>

        <WaitlistClient initialOrgs={waitlistedOrgs} />
      </div>
    </div>
  )
}

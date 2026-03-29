import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import DashboardSidebar from './sidebar'
import { Clock } from 'lucide-react'
import AiAssist from '@/components/dashboard/AiAssist'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Get user + org
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })
  if (!org) redirect('/onboarding')

  // Check trial
  const trialDaysLeft = org.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0
  const isOnTrial = org.plan === 'trial' && trialDaysLeft > 0

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <DashboardSidebar org={org} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {/* Trial Banner */}
        {isOnTrial && (
          <div className="bg-[#FFF4E5] border-b border-[#FFE2C2] px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <p className="text-amber-900 text-sm font-bold uppercase tracking-wider">
                {trialDaysLeft} days remaining in trial
              </p>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="text-sm bg-amber-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Subscribe — $29/mo
            </Link>
          </div>
        )}
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 relative">
          {children}
        </main>
        <AiAssist />
      </div>
    </div>
  )
}

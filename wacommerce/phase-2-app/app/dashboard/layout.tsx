import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import DashboardSidebar from './sidebar'
import { Clock } from 'lucide-react'
import AiAssist from '@/components/dashboard/AiAssist'
import WaitlistOverlay from '@/components/dashboard/WaitlistOverlay'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })
  if (!org) redirect('/onboarding')

  // Calculate trial status
  const trialDaysLeft = org.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0
  const isOnTrial = org.plan === 'trial' && trialDaysLeft > 0
  const isWaitlisted = org.is_waitlisted === 1
  // ⛔ Trial expired: still on 'trial' plan but date is past
  const isTrialExpired = org.plan === 'trial' && trialDaysLeft === 0

  if (isWaitlisted) {
    return <WaitlistOverlay country={org.country || 'Global'} />
  }

  // ⛔ HARD LOCKOUT — enforce 7-day trial, no free rides
  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6 font-outfit">
        <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-lg w-full text-center space-y-8 border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100">
            <Clock size={36} className="text-amber-500" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                <span className="text-white font-black text-sm font-serif">C</span>
              </div>
              <span className="font-serif font-black text-xl tracking-tighter text-[#075E54]">Chatevo</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 font-serif italic">Your Trial Has Ended</h1>
            <p className="text-slate-500 mt-3 font-medium leading-relaxed max-w-sm mx-auto">
              Your 7-day free trial is over. Subscribe to keep selling on WhatsApp — your products and contacts are safe.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="https://paystack.shop/pay/chatevo-starter"
              className="block w-full bg-[#075E54] text-white py-5 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-[#075E54]/20 uppercase tracking-widest"
            >
              🌱 Starter — KES 3,500/mo
            </a>
            <a
              href="https://paystack.shop/pay/chatevo-growth"
              className="block w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-[#25D366]/20 uppercase tracking-widest"
            >
              ⭐ Growth — KES 7,000/mo (Best Value)
            </a>
            <a
              href="https://paystack.shop/pay/chatevo-elite"
              className="block w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest"
            >
              👑 Elite — KES 13,000/mo
            </a>
          </div>

          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Secure payments via Paystack · Cancel anytime
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <DashboardSidebar org={org} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {/* Trial Banner — only shown when still in trial */}
        {isOnTrial && (
          <div className="bg-[#FFF4E5] border-b border-[#FFE2C2] px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <p className="text-amber-900 text-sm font-bold uppercase tracking-wider">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in free trial
              </p>
            </div>
            <a
              href="https://paystack.shop/pay/chatevo-starter"
              className="text-xs bg-amber-500 text-white px-4 py-2 rounded-lg font-black hover:bg-amber-600 transition-colors uppercase tracking-wider"
            >
              Subscribe — KES 3,500
            </a>
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

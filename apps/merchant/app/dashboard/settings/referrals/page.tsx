import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { Gift, Users, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import ReferralsClient from './referrals-client'

export const dynamic = 'force-dynamic'

const REFERRAL_GOAL = 10

export default async function MerchantReferralPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
  if (!org) redirect('/onboarding')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.app'

  // Use org.referral_code if set; generate a stable fallback from org.id
  const code = org.referral_code || org.id.slice(0, 8).toUpperCase()
  const referralLink = `${appUrl}/?ref=${code}`

  const payingCount = org.paying_referrals_count ?? 0
  const discountActive = (org.referral_discount_active ?? 0) === 1
  const percentage = Math.min(100, Math.round((payingCount / REFERRAL_GOAL) * 100))

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight font-serif mb-2">Merchant Referrals</h1>
        <p className="text-muted-foreground font-medium">
          Refer other businesses to Chatevo and earn <strong>50% off your subscription for 6 months</strong>.
        </p>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30" />

        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-800/50 border border-emerald-700/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-200">
              <Sparkles size={14} />
              {discountActive ? '🎉 Discount Active!' : 'B2B Partner Program'}
            </div>

            {discountActive ? (
              <>
                <h2 className="text-4xl md:text-5xl font-black font-serif leading-tight">
                  50% Off<br />Activated!
                </h2>
                <p className="text-emerald-100 font-medium text-lg max-w-sm">
                  You&apos;ve hit {REFERRAL_GOAL} paying referrals.
                  {org.referral_discount_expires_at
                    ? ` Your discount is active until ${new Date(org.referral_discount_expires_at).toLocaleDateString()}.`
                    : ' Your 50% discount is now active for 6 months.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-4xl md:text-5xl font-black font-serif leading-tight">
                  Get 50% Off<br />For 6 Months
                </h2>
                <p className="text-emerald-100 font-medium text-lg max-w-sm">
                  Refer {REFERRAL_GOAL} paying merchants to Chatevo and automatically unlock half-price scaling.
                </p>
              </>
            )}
          </div>

          {/* Progress card */}
          <div className="w-full md:w-80 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-emerald-200 text-sm font-bold uppercase tracking-widest">Progress</p>
                <p className="text-4xl font-black font-serif mt-1">
                  {payingCount} <span className="text-xl text-emerald-200/70 font-sans tracking-tight">/ {REFERRAL_GOAL}</span>
                </p>
              </div>
              <Gift size={32} className="text-emerald-300 mb-1" />
            </div>

            <div className="h-3 bg-emerald-950/50 rounded-full overflow-hidden mb-6 border border-emerald-800/30">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[#25D366] transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Referral link with copy */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-emerald-100">Your Invite Link</p>
              {/* ReferralsClient handles copy-to-clipboard interactively */}
              <ReferralsClient referralLink={referralLink} />
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">1. Share Your Link</h3>
          <p className="text-muted-foreground text-sm font-medium">Send your unique link to other business owners who sell on WhatsApp.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">2. They Subscribe</h3>
          <p className="text-muted-foreground text-sm font-medium">Your progress bar updates automatically when they become a paying merchant.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-[#25D366] rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">3. Unlock 50% Off</h3>
          <p className="text-muted-foreground text-sm font-medium">Hit {REFERRAL_GOAL} paying referrals and your next 6 months are billed at half price.</p>
        </div>
      </div>

      {/* Rules callout */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
        <p className="font-bold mb-1">Program Rules</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>Only paying merchants (Starter, Pro, or Elite plan) count toward your goal.</li>
          <li>Trial signups do not count until they become paying.</li>
          <li>The 50% discount applies to your SaaS subscription only, for 6 calendar months.</li>
          <li>Discount activates automatically — no action needed from you.</li>
        </ul>
      </div>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { Copy, Gift, Users, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'

// Dummy progress, in real implementation we count from organizations where referred_by = org.id
const currentReferrals = 3
const GOAL = 10

export default async function MerchantReferralPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
  if (!org) redirect('/onboarding')

  const percentage = Math.min(100, Math.round((currentReferrals / GOAL) * 100))

  return (
    <div className="max-w-4xl space-y-8">
      <div>
         <h1 className="text-3xl font-black text-foreground tracking-tight font-serif mb-2">Merchant Referrals</h1>
         <p className="text-muted-foreground font-medium">Refer other businesses to Sella and get 50% off your subscription.</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-800/50 border border-emerald-700/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-200">
              <Sparkles size={14} /> B2B Partner Program
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black font-serif leading-tight">
              Get 50% Off<br/>For 6 Months
            </h2>
            <p className="text-emerald-100 font-medium text-lg max-w-sm">
              Refer {GOAL} paying merchants to Sella and automatically unlock half-price scaling.
            </p>
          </div>

          <div className="w-full md:w-80 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-emerald-200 text-sm font-bold uppercase tracking-widest">Progress</p>
                <p className="text-4xl font-black font-serif mt-1">{currentReferrals} <span className="text-xl text-emerald-200/70 font-sans tracking-tight">/ {GOAL}</span></p>
              </div>
              <Gift size={32} className="text-emerald-300 mb-1" />
            </div>

            <div className="h-3 bg-emerald-950/50 rounded-full overflow-hidden mb-6 border border-emerald-800/30">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-[#25D366] transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-emerald-100">Your Invite Link</p>
              <div className="flex items-center gap-2 bg-emerald-950/50 p-2 rounded-xl border border-emerald-800/50">
                <code className="text-xs text-emerald-200 flex-1 truncate px-2 font-bold tracking-tight">
                  {process.env.NEXT_PUBLIC_APP_URL}/?ref={org.id.slice(0, 8)}
                </code>
                <button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 p-2 rounded-lg transition-colors font-bold shadow-sm">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">1. Share Your Link</h3>
          <p className="text-muted-foreground text-sm font-medium">Send your unique link to other business owners who need to sell on WhatsApp.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">2. They Upgrade</h3>
          <p className="text-muted-foreground text-sm font-medium">Your progress bar updates automatically when they fully subscribe to a paid plan.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-[#25D366] rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">3. Unlock Discount</h3>
          <p className="text-muted-foreground text-sm font-medium">Hit 10 active referrals and your next 6 months will automatically be billed at 50%.</p>
        </div>
      </div>
    </div>
  )
}

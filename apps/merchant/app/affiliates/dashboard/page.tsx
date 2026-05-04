import Link from 'next/link'
import { Wallet, Users, TrendingUp, HandCoins, Target, Download, Copy, AlertCircle, Clock } from 'lucide-react'
import AffiliateDashboardClient from './dashboard-client'

// This is a Server Component that acts as a gate.
// The affiliate dashboard is accessed by appending ?email= to the URL.
// In a future version this would use a cookie/session set after email verification.
export const dynamic = 'force-dynamic'

interface AffiliateData {
  id: string
  name: string
  email: string
  status: string
  referral_code: string
  referral_link: string
  total_referred: number
  total_earned: number
  balance: number
  payment_details: string | null
}

interface ReferralRow {
  org_id: string
  org_name: string
  plan: string | null
  is_paying: boolean
  total_commission: number
  recurring_payments: number
}

async function getAffiliateData(email: string): Promise<{ affiliate: AffiliateData | null; referrals: ReferralRow[]; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const [meRes, refRes] = await Promise.all([
      fetch(`${appUrl}/api/affiliates/me?email=${encodeURIComponent(email)}`, { cache: 'no-store' }),
      fetch(`${appUrl}/api/affiliates/referrals?email=${encodeURIComponent(email)}`, { cache: 'no-store' }),
    ])
    const me = await meRes.json() as AffiliateData & { error?: string }
    if (!meRes.ok) return { affiliate: null, referrals: [], error: me.error }

    const ref = await refRes.json() as { data: ReferralRow[] }
    return { affiliate: me, referrals: ref.data || [] }
  } catch {
    return { affiliate: null, referrals: [], error: 'Failed to load affiliate data.' }
  }
}

export default async function AffiliateDashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const email = typeof searchParams.email === 'string' ? searchParams.email : null

  if (!email) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-black font-serif mb-2">Access Your Dashboard</h1>
          <p className="text-slate-500 mb-6">Enter your registered affiliate email to view your dashboard.</p>
          <form method="GET" className="flex gap-2">
            <input name="email" type="email" required
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              placeholder="your@email.com" />
            <button type="submit"
              className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
              View
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-4">
            Not an affiliate yet?{' '}
            <Link href="/affiliates/apply" className="text-[#25D366] font-bold hover:underline">Apply here →</Link>
          </p>
        </div>
      </div>
    )
  }

  const { affiliate, referrals, error } = await getAffiliateData(email)

  if (error || !affiliate) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-black font-serif mb-2">Account Not Found</h1>
          <p className="text-slate-500 mb-6">{error || 'No affiliate account found for this email.'}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/affiliates/apply" className="bg-[#25D366] text-white px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90">
              Apply to Join
            </Link>
            <Link href="/affiliates/dashboard" className="border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-50">
              Try Another Email
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (affiliate.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={32} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-black font-serif mb-2">Application Under Review</h1>
          <p className="text-slate-500">Hi {affiliate.name}, your application is being reviewed by our team. We&apos;ll email you at <strong>{affiliate.email}</strong> once approved.</p>
          <p className="text-xs text-slate-400 mt-4">Average review time: 2 business days.</p>
        </div>
      </div>
    )
  }

  if (affiliate.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black font-serif mb-2">Application Not Approved</h1>
          <p className="text-slate-500">We were unable to approve your affiliate application at this time. Contact support for details.</p>
        </div>
      </div>
    )
  }

  // Approved affiliate — show full dashboard
  return <AffiliateDashboardClient affiliate={affiliate} referrals={referrals} />
}

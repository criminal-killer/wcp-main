import Link from 'next/link'
import { Wallet, Users, TrendingUp, HandCoins, Target, Download, Copy, AlertCircle, Clock } from 'lucide-react'
import AffiliateDashboardClient from './dashboard-client'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

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

async function getAffiliateData(): Promise<{ affiliate: AffiliateData | null; referrals: ReferralRow[]; error?: string; status?: number }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const meRes = await fetch(`${appUrl}/api/affiliates/me`, { headers: headers(), cache: 'no-store' })
    if (!meRes.ok) {
      const errorData = await meRes.json().catch(() => ({}))
      return { affiliate: null, referrals: [], error: errorData.error || 'Failed to load affiliate data.', status: meRes.status }
    }
    const meData = await meRes.json() as { affiliate: AffiliateData }
    
    let referrals: ReferralRow[] = []
    if (meData.affiliate.status === 'approved') {
      const refRes = await fetch(`${appUrl}/api/affiliates/referrals`, { headers: headers(), cache: 'no-store' })
      if (refRes.ok) {
        const refData = await refRes.json() as { data: ReferralRow[] }
        referrals = refData.data || []
      }
    }
    
    return { affiliate: meData.affiliate, referrals, status: 200 }
  } catch (err: any) {
    return { affiliate: null, referrals: [], error: err.message || 'Failed to load affiliate data.', status: 500 }
  }
}

export default async function AffiliateDashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in?redirect_url=/affiliates/dashboard')
  }

  const { affiliate, referrals, error, status } = await getAffiliateData()

  if (status === 401 || error === 'Not signed in') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-slate-500" />
          </div>
          <h1 className="text-xl font-black font-serif mb-2">Please sign in</h1>
          <p className="text-slate-500 mb-6">{error || 'You must be signed in to view this page.'}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-in?redirect_url=/affiliates/dashboard" className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 404 || !affiliate) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-black font-serif mb-2">Account Not Found</h1>
          <p className="text-slate-500 mb-6">{error || 'No affiliate application found for this account.'}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/affiliates/apply" className="bg-[#25D366] text-white px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90">
              Apply to Join
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
          <div className="mt-8 text-sm text-slate-500">
            Need help? <a href="mailto:mazaoedu@gmail.com?subject=Affiliate%20Help" className="text-primary hover:underline">Contact Support</a>
          </div>
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
          <p className="text-slate-500">We were unable to approve your affiliate application at this time.</p>
          <div className="mt-8 text-sm text-slate-500">
            Need help? <a href="mailto:mazaoedu@gmail.com?subject=Affiliate%20Help" className="text-primary hover:underline">Contact Support</a>
          </div>
        </div>
      </div>
    )
  }

  // Approved affiliate — show full dashboard
  return <AffiliateDashboardClient affiliate={affiliate} referrals={referrals} />
}

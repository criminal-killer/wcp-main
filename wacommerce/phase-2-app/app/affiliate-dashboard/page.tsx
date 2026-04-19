import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Copy, Users, DollarSign, Activity, MessageCircle } from 'lucide-react'
import AffiliateDashboardClient from './dashboard-client'

export default async function AffiliateDashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/affiliates/login')

  // Find their affiliate record
  const affiliate = await db.query.affiliates.findFirst({
    where: (aff, { eq }) => eq(aff.clerk_id, user.id)
  })

  if (!affiliate) {
    // If not found, maybe they are a regular user, redirect out or prompt them to join.
    redirect('/affiliates/apply')
  }

  // The base URL for the app (can be dynamic based on env)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo-app.vercel.app'
  const targetLink = `${baseUrl}/affiliates/apply?ref=${affiliate.referral_code}`

  return (
    <div className="space-y-8 font-outfit">
      
      <div>
        <h1 className="text-3xl font-black font-serif mb-2">Welcome back, {affiliate.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-600">Here's a breakdown of your network and earnings directly powered by Chatevo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="text-green-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 mb-1">Available Balance</p>
          <p className="text-3xl font-black">${affiliate.balance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <Activity className="text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 mb-1">Total Earned All-Time</p>
          <p className="text-3xl font-black">${affiliate.total_earned.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="text-purple-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 mb-1">Direct Referrals (10%)</p>
          <p className="text-3xl font-black">{affiliate.total_referred}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="text-orange-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 mb-1">Network Tier 2 (2%)</p>
          <p className="text-3xl font-black">{affiliate.total_network}</p>
        </div>
      </div>

      <div className="bg-white p-8 border border-slate-200 rounded-3xl">
        <h2 className="text-xl font-bold mb-4">Your Custom Referral Link</h2>
        <p className="text-slate-600 mb-6 text-sm">Share this link directly. Anyone who applies tracking this code will automatically be assigned to your network tree.</p>
        
        <AffiliateDashboardClient targetLink={targetLink} referralCode={affiliate.referral_code} />
      </div>

      {/* AI Assistant Chat UI handled in the client file to avoid Server Component constraints */}
    </div>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Wallet, Users, TrendingUp, HandCoins, Target, Copy, Check, Download, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react'

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

const MIN_PAYOUT = 100

export default function AffiliateDashboardClient({
  affiliate,
  referrals,
}: {
  affiliate: AffiliateData
  referrals: ReferralRow[]
}) {
  const [copied, setCopied] = useState(false)
  const [payoutState, setPayoutState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [payoutMsg, setPayoutMsg] = useState('')

  const copyLink = async () => {
    await navigator.clipboard.writeText(affiliate.referral_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const requestPayout = async () => {
    if (affiliate.balance < MIN_PAYOUT) return
    setPayoutState('loading')
    try {
      const res = await fetch('/api/affiliates/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: affiliate.email }),
      })
      const data = await res.json() as { success?: boolean; message?: string; error?: string }
      if (res.ok && data.success) {
        setPayoutState('success')
        setPayoutMsg(data.message || 'Payout request submitted successfully.')
      } else {
        setPayoutState('error')
        setPayoutMsg(data.error || 'Failed to submit payout request.')
      }
    } catch {
      setPayoutState('error')
      setPayoutMsg('Network error. Please try again.')
    }
  }

  const activeReferrals = referrals.filter(r => r.is_paying).length

  return (
    <div className="min-h-screen bg-slate-50 font-outfit flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen fixed">
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="font-serif font-black text-2xl text-primary block">
            Chatevo <span className="text-[10px] uppercase font-sans tracking-widest text-slate-400">Affiliates</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href={`/affiliates/dashboard?email=${encodeURIComponent(affiliate.email)}`}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold bg-green-50 text-[#25D366] rounded-xl">
            <TrendingUp size={18} /> Overview
          </Link>
          <Link href="#referrals"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Users size={18} /> My Referrals
          </Link>
          <Link href="#swipe-file"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Download size={18} /> Marketing Kit
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100 mt-auto">
          <p className="text-xs text-slate-400 px-4 mb-2 font-bold uppercase tracking-widest">Logged in as</p>
          <p className="text-sm font-bold text-slate-700 px-4 truncate">{affiliate.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 space-y-8">
        {/* Header + referral link */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black font-serif tracking-tight">Welcome back, {affiliate.name}</h1>
            <p className="text-slate-500 font-medium">Here&apos;s what&apos;s happening with your referrals.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Link:</span>
            <code className="text-sm font-bold text-primary truncate max-w-[180px]">{affiliate.referral_link}</code>
            <button
              onClick={copyLink}
              className="ml-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-800"
              title="Copy referral link"
            >
              {copied ? <Check size={16} className="text-[#25D366]" /> : <Copy size={16} />}
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance + Payout */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Available Balance</p>
                <Wallet className="text-[#25D366]" size={24} />
              </div>
              <p className="text-4xl font-black text-slate-900">${(affiliate.balance ?? 0).toFixed(2)}</p>

              {payoutState === 'success' && (
                <div className="mt-4 flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-xl text-xs font-bold">
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" /> {payoutMsg}
                </div>
              )}
              {payoutState === 'error' && (
                <div className="mt-4 flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-xl text-xs font-bold">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {payoutMsg}
                </div>
              )}

              <button
                onClick={requestPayout}
                disabled={affiliate.balance < MIN_PAYOUT || payoutState === 'loading' || payoutState === 'success'}
                className="mt-6 w-full text-sm font-bold bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <HandCoins size={16} />
                {payoutState === 'loading'
                  ? 'Submitting...'
                  : payoutState === 'success'
                    ? 'Request Submitted ✓'
                    : affiliate.balance >= MIN_PAYOUT
                      ? `Request Payout ($${affiliate.balance.toFixed(2)})`
                      : `$${MIN_PAYOUT} Minimum Required`}
              </button>
              {affiliate.balance < MIN_PAYOUT && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  ${(MIN_PAYOUT - affiliate.balance).toFixed(2)} more to go
                </p>
              )}
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Earned</p>
                <TrendingUp className="text-blue-500" size={24} />
              </div>
              <p className="text-4xl font-black text-slate-900">${(affiliate.total_earned ?? 0).toFixed(2)}</p>
              <p className="text-sm text-slate-500 font-medium mt-2">Lifetime commissions.</p>
            </div>
          </div>

          {/* Active Referrals */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Referrals</p>
                <Users className="text-purple-500" size={24} />
              </div>
              <p className="text-4xl font-black text-slate-900">{activeReferrals}</p>
              <p className="text-sm text-slate-500 font-medium mt-2">Paying merchants · 10% recurring.</p>
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        <section id="referrals" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-black font-serif">My Referrals</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{referrals.length} total</span>
          </div>
          {referrals.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="font-bold text-slate-400">No referrals yet.</p>
              <p className="text-sm text-slate-400 mt-1">Share your link to start earning commissions.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="text-left px-6 py-3">Merchant</th>
                  <th className="text-left px-6 py-3">Plan</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Commission</th>
                  <th className="text-right px-6 py-3">Renewals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {referrals.map(r => (
                  <tr key={r.org_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-slate-800">{r.org_name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 capitalize">{r.plan || 'trial'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${r.is_paying ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.is_paying ? 'Paying' : 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-slate-800 text-right">
                      ${r.total_commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500 text-right">{r.recurring_payments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Marketing Kit */}
        <section id="swipe-file" className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black font-serif tracking-tight">Marketing Kit</h2>
              <p className="text-slate-500 font-medium mt-1">Copy &amp; paste these to your audience.</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 flex items-center justify-center rounded-2xl">
              <Target size={24} className="text-indigo-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Email Template</h3>
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative group">
              <button
                onClick={() => {
                  const template = `Subject: Transform your WhatsApp into a real store 🚀\n\nHey [Name],\n\nI know you've been struggling with managing orders on WhatsApp. I just found Chatevo and it's a game-changer.\n\nIt lets you build a full catalog, accept payments, and manage orders without buyers ever leaving the chat.\n\nCheck it out: ${affiliate.referral_link}\n\nBest,\n[Your Name]`
                  navigator.clipboard.writeText(template)
                }}
                className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 flex items-center gap-2 text-xs font-bold text-slate-600"
              >
                <Copy size={14} /> Copy
              </button>
              <div className="space-y-3 text-sm font-medium text-slate-700">
                <p><strong>Subject:</strong> Transform your WhatsApp into a real store 🚀</p>
                <hr className="border-slate-200" />
                <p>Hey [Name],</p>
                <p>I just found Chatevo and it&apos;s a game-changer for WhatsApp selling — full catalog, Stripe/Paystack payments, and order management.</p>
                <p>Check it out: <strong>{affiliate.referral_link}</strong></p>
                <p>Best,<br />[Your Name]</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

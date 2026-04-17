'use client'
import { useEffect, useState } from 'react'
import { Copy, Check, Gift, Users, TrendingUp, ExternalLink, Share2, Loader2, CheckCircle2, Clock, CreditCard } from 'lucide-react'

interface ReferralData {
  referral_code: string
  referral_link: string
  total_referrals: number
  active_referrals: number
  referred_list: Array<{
    name: string
    plan: string | null
    joined_at: string | null
    status: 'trial' | 'paid'
  }>
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function ReferralsDashboard() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const GOAL = 10

  useEffect(() => {
    fetch('/api/referrals')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const copyLink = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referral_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareLink = async () => {
    if (!data) return
    if (navigator.share) {
      await navigator.share({
        title: 'Join Chatevo — WhatsApp Commerce',
        text: 'I use Chatevo to sell on WhatsApp. Try it free for 7 days!',
        url: data.referral_link,
      })
    } else {
      copyLink()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  const activeCount = data?.active_referrals ?? 0
  const totalCount = data?.total_referrals ?? 0
  const progress = Math.min(100, Math.round((activeCount / GOAL) * 100))
  const remaining = Math.max(0, GOAL - activeCount)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Referral Program</h1>
        <p className="text-slate-500 mt-1">
          Refer {GOAL} paying businesses and earn <strong className="text-emerald-600">30% commission</strong> for month 1, then 10% for months 2–7.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total Referred" value={totalCount} sub="Any plan" icon={Users} color="bg-blue-50 text-blue-500" />
        <StatCard label="Paying Referrals" value={activeCount} sub="Not on trial" icon={CreditCard} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Goal Progress" value={`${activeCount}/${GOAL}`} sub={remaining > 0 ? `${remaining} more to unlock reward` : '🎉 Goal reached!'} icon={TrendingUp} color="bg-amber-50 text-amber-500" />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-slate-600">Progress to Reward</span>
          <span className="text-emerald-600 font-bold">{progress}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          {activeCount >= GOAL
            ? '✅ You have reached the reward threshold! Chatevo will apply your discount on the next billing cycle.'
            : `Refer ${remaining} more paying merchant${remaining !== 1 ? 's' : ''} to unlock your 30% commission reward.`}
        </p>
      </div>

      {/* Referral Link Box */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={18} className="text-emerald-500" />
          <h2 className="font-semibold text-slate-800">Your Referral Link</h2>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <code className="text-sm text-slate-600 font-mono flex-1 truncate select-all">
            {data?.referral_link ?? 'Loading...'}
          </code>
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={shareLink}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Share2 size={15} /> Share via WhatsApp / Social
          </button>
          <span className="text-slate-200">|</span>
          <span className="text-xs text-slate-400 font-medium">Code: <strong className="text-slate-600 font-mono">{data?.referral_code}</strong></span>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">How You Earn</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share your link', desc: 'Send the link to business owners who need to sell on WhatsApp.' },
            { step: '2', title: 'They subscribe', desc: 'You earn 30% of their first payment, then 10% for months 2–7.' },
            { step: '3', title: 'Get paid', desc: 'Commissions paid via M-Pesa or bank within 7 days of each payment.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Users Table */}
      {data && data.referred_list.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Your Referrals ({totalCount})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {data.referred_list.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                    {r.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.joined_at ? new Date(r.joined_at).toLocaleDateString() : 'Unknown date'}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  r.status === 'paid'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {r.status === 'paid' ? '✓ Paying' : 'On Trial'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.referred_list.length === 0 && (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Gift size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No referrals yet</p>
          <p className="text-sm text-slate-400 mt-1">Share your link to start earning. Every paying referral counts!</p>
        </div>
      )}

      {/* Apply to full affiliate program */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-emerald-800">Want to be a full Affiliate Partner?</p>
          <p className="text-sm text-emerald-600 mt-0.5">Apply to the Chatevo Affiliate Program for dedicated support, marketing materials, and higher commissions.</p>
        </div>
        <a
          href="/affiliates/apply"
          className="shrink-0 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          Apply Now <ExternalLink size={15} />
        </a>
      </div>
    </div>
  )
}

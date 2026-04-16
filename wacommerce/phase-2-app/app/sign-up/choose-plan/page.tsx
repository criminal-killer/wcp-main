'use client'
import { useState } from 'react'
import { Check, X, Zap, Shield, Crown, Star, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

// ============================================================
// CHATEVO PRICING PLANS — KES via Paystack Hosted Pages
// ============================================================
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    emoji: '🌱',
    price: 3500,
    paystackUrl: 'https://paystack.shop/pay/chatevo-starter',
    description: 'Perfect for solo sellers just getting started on WhatsApp.',
    icon: Star,
    popular: false,
    color: 'slate',
    features: {
      'AI WhatsApp Bot': true,
      'Products Limit': '50 products',
      'Orders Management': true,
      'Customer Contacts': true,
      'Manual Payments (MPesa/Bank)': true,
      'Order Tracking': true,
      'Basic Analytics': true,
      'Digital Product Delivery': false,
      'Abandoned Cart Recovery': false,
      'Custom Bot Persona': false,
      'Bulk Broadcasts': false,
      'Priority Support': false,
      'Multi-User Access': false,
      'API Access': false,
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    emoji: '🚀',
    price: 7000,
    paystackUrl: 'https://paystack.shop/pay/chatevo-growth',
    description: 'Scale your sales with automation and smart AI tools.',
    icon: Zap,
    popular: true,
    color: 'primary',
    features: {
      'AI WhatsApp Bot': true,
      'Products Limit': 'Unlimited',
      'Orders Management': true,
      'Customer Contacts': true,
      'Manual Payments (MPesa/Bank)': true,
      'Order Tracking': true,
      'Basic Analytics': true,
      'Digital Product Delivery': true,
      'Abandoned Cart Recovery': true,
      'Custom Bot Persona': true,
      'Bulk Broadcasts': true,
      'Priority Support': true,
      'Multi-User Access': false,
      'API Access': false,
    },
  },
  {
    id: 'elite',
    name: 'Elite',
    emoji: '👑',
    price: 13000,
    paystackUrl: 'https://paystack.shop/pay/chatevo-elite',
    description: 'The ultimate toolkit for high-volume sellers and teams.',
    icon: Crown,
    popular: false,
    color: 'amber',
    features: {
      'AI WhatsApp Bot': true,
      'Products Limit': 'Unlimited',
      'Orders Management': true,
      'Customer Contacts': true,
      'Manual Payments (MPesa/Bank)': true,
      'Order Tracking': true,
      'Basic Analytics': true,
      'Digital Product Delivery': true,
      'Abandoned Cart Recovery': true,
      'Custom Bot Persona': true,
      'Bulk Broadcasts': true,
      'Priority Support': true,
      'Multi-User Access': '5 users',
      'API Access': true,
    },
  },
]

const ALL_FEATURES = [
  'AI WhatsApp Bot',
  'Products Limit',
  'Orders Management',
  'Customer Contacts',
  'Manual Payments (MPesa/Bank)',
  'Order Tracking',
  'Basic Analytics',
  'Digital Product Delivery',
  'Abandoned Cart Recovery',
  'Custom Bot Persona',
  'Bulk Broadcasts',
  'Priority Support',
  'Multi-User Access',
  'API Access',
]

export default function ChoosePlanPage() {
  const [view, setView] = useState<'cards' | 'compare'>('cards')

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-outfit">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
              <span className="text-white font-black text-sm font-serif">C</span>
            </div>
            <span className="font-serif font-black text-xl tracking-tighter text-[#075E54]">Chatevo</span>
          </Link>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
            <Clock size={13} />
            <span className="text-[10px] font-black uppercase tracking-widest">7-Day Free Trial</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-full px-5 py-2">
            <span className="w-2 h-2 bg-[#25D366] rounded-full animate-ping" />
            <span className="text-[#075E54] text-xs font-black tracking-[0.2em] uppercase">Simple, Honest Pricing</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-[#111B21] tracking-tight leading-none">
            Choose Your <span className="text-[#25D366] italic">Plan</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
            All plans include a <strong>7-day free trial</strong>. No card charge until after 7 days. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setView('cards')}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === 'cards' ? 'bg-[#075E54] text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              Plan Cards
            </button>
            <button
              onClick={() => setView('compare')}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === 'compare' ? 'bg-[#075E54] text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              Compare All Features
            </button>
          </div>
        </div>

        {/* CARD VIEW */}
        {view === 'cards' && (
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-[2.5rem] p-10 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col ${
                  plan.popular ? 'border-[#25D366] shadow-2xl shadow-[#25D366]/10 scale-105' : 'border-slate-100 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#25D366] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6 flex-1">
                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl`}>{plan.emoji}</div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 font-serif">{plan.name}</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chatevo {plan.name}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-400 uppercase tracking-wider">KES</span>
                      <span className="text-4xl font-black text-slate-900">{plan.price.toLocaleString()}</span>
                      <span className="text-slate-400 font-bold">/mo</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-3">
                    {ALL_FEATURES.map((feat) => {
                      const val = plan.features[feat as keyof typeof plan.features]
                      if (val === false) return null
                      return (
                        <div key={feat} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <Check size={11} className="text-green-600 stroke-[3px]" />
                          </div>
                          <span className="text-sm font-bold text-slate-600">
                            {typeof val === 'string' ? `${feat}: ${val}` : feat}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* CTAs — Pay Now or Start Trial */}
                <div className="space-y-3 mt-8">
                  <a
                    href={plan.paystackUrl}
                    className={`block w-full py-5 rounded-2xl font-black text-sm text-center transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-[#075E54] text-white shadow-xl shadow-[#075E54]/20 hover:opacity-90'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Pay Now — KES {plan.price.toLocaleString()} <ArrowRight size={16} />
                  </a>
                  <Link
                    href={`/onboarding?plan=${plan.id}`}
                    className="block w-full py-4 rounded-2xl font-black text-xs text-center border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#25D366] hover:text-[#075E54] transition-all flex items-center justify-center gap-2"
                  >
                    <Clock size={13} /> Start 7-Day Free Trial
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMPARISON TABLE */}
        {view === 'compare' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-slate-400 w-1/3">Feature</th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} className={`p-6 text-center ${plan.popular ? 'bg-[#F0FFF4]' : ''}`}>
                        <div className="text-2xl mb-1">{plan.emoji}</div>
                        <div className="font-black text-slate-900 font-serif">{plan.name}</div>
                        <div className="text-xs font-black text-slate-400 mt-1">KES {plan.price.toLocaleString()}/mo</div>
                        {plan.popular && (
                          <span className="inline-block mt-2 bg-[#25D366] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Popular</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_FEATURES.map((feat, i) => (
                    <tr key={feat} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                      <td className="p-5 text-sm font-bold text-slate-600">{feat}</td>
                      {PLANS.map((plan) => {
                        const val = plan.features[feat as keyof typeof plan.features]
                        return (
                          <td key={plan.id} className={`p-5 text-center ${plan.popular ? 'bg-[#F0FFF4]/50' : ''}`}>
                            {val === true ? (
                              <Check size={18} className="text-green-500 mx-auto stroke-[3px]" />
                            ) : val === false ? (
                              <X size={16} className="text-slate-200 mx-auto stroke-[3px]" />
                            ) : (
                              <span className="text-xs font-black text-[#075E54]">{val}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {/* CTA Row */}
                  <tr>
                    <td className="p-6" />
                    {PLANS.map((plan) => (
                      <td key={plan.id} className={`p-6 ${plan.popular ? 'bg-[#F0FFF4]/50' : ''}`}>
                        <div className="space-y-2">
                          <a
                            href={plan.paystackUrl}
                            className="block w-full py-3 rounded-xl font-black text-xs text-center bg-[#075E54] text-white hover:opacity-90 transition-all"
                          >
                            Pay Now
                          </a>
                          <Link
                            href={`/onboarding?plan=${plan.id}`}
                            className="block w-full py-3 rounded-xl font-black text-xs text-center border border-slate-200 text-slate-500 hover:border-[#25D366] hover:text-[#075E54] transition-all"
                          >
                            Free Trial
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trust Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-8 flex-wrap text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>✅ Secure via Paystack</span>
            <span>✅ Cancel Anytime</span>
            <span>✅ 7-Day Free Trial</span>
            <span>✅ M-Pesa Accepted</span>
          </div>
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
            © 2026 Chatevo · Sell Smarter on WhatsApp
          </p>
        </div>
      </div>
    </div>
  )
}

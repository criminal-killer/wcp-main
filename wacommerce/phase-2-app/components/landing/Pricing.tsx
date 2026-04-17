import Link from 'next/link'
import { CheckCircle, Star } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter', price: 3500, color: 'slate',
    href: 'https://paystack.shop/pay/chatevo-starter',
    features: ['AI WhatsApp Bot', '250 Products', 'MPesa/Bank Payments', 'Order Management', 'Basic Analytics'],
  },
  {
    name: 'Growth', price: 7000, color: 'emerald', popular: true,
    href: 'https://paystack.shop/pay/chatevo-growth',
    features: ['Everything in Starter', '5,000 Products', 'Digital Product Delivery', 'Abandoned Cart Recovery', 'Custom Bot Persona', 'Bulk Broadcasts'],
  },
  {
    name: 'Elite', price: 13000, color: 'amber',
    href: 'https://paystack.shop/pay/chatevo-elite',
    features: ['Everything in Growth', '10,000 Products', '5 Team Members', 'API Access', 'Priority Support', 'White-label Option'],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto">
      <div className="mb-14 text-center">
        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">Simple pricing</p>
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Start free, pay in KES</h2>
        <p className="text-slate-500 mt-3">7-day free trial on all plans. No hidden fees. Cancel anytime.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`rounded-2xl p-8 border-2 ${plan.popular ? 'border-emerald-500 shadow-lg' : 'border-slate-100 bg-white'}`}
          >
            {plan.popular && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full mb-4">
                <Star size={10} fill="white" /> Most Popular
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-sm text-slate-400 font-medium">KES</span>
              <span className="text-3xl font-bold text-slate-900">{plan.price.toLocaleString()}</span>
              <span className="text-slate-400 text-sm">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <a
                href={plan.href}
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
              >
                Pay KES {plan.price.toLocaleString()}
              </a>
              <Link href="/sign-up" className="block w-full text-center py-3 rounded-xl font-medium text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors">
                Start 7-day free trial
              </Link>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-slate-400 mt-8">All payments via Paystack · M-Pesa accepted · Secure checkout</p>
    </section>
  )
}

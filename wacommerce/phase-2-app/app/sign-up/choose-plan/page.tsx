'use client'
import { useState } from 'react'
import { Check, Zap, Shield, Crown, ArrowRight, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    description: 'Perfect for small businesses starting on WhatsApp.',
    features: [
      'Automated Shop Bot',
      'Up to 50 Products',
      'Basic Analytics',
      'Email Support',
      '7-Day Free Trial'
    ],
    icon: Star,
    color: 'slate',
    buttonText: 'Start 7-Day Trial',
    requiresCard: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '59',
    description: 'Grow your business with advanced automation.',
    features: [
      'Everything in Starter',
      'Unlimited Products',
      'AI Auto-Replies',
      'Abandoned Cart Recovery',
      'Priority Support',
      'Custom Branding'
    ],
    icon: Zap,
    color: 'primary',
    popular: true,
    buttonText: 'Choose Pro',
    requiresCard: true
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '99',
    description: 'The ultimate power for high-volume sellers.',
    features: [
      'Everything in Pro',
      'Dedicated Account Manager',
      'Custom AI Training',
      'Advanced Marketing Tools',
      'API Access',
      'Multi-User Access'
    ],
    icon: Crown,
    color: 'amber',
    buttonText: 'Choose Elite',
    requiresCard: true
  }
]

export default function ChoosePlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelect = (plan: typeof PLANS[0]) => {
    setLoading(plan.id)
    // Redirect to signup with plan info
    router.push(`/sign-up?plan=${plan.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-[#111B21] tracking-tight">
            Choose your <span className="text-primary italic">Success</span> Plan
          </h1>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto uppercase tracking-widest text-sm">
            All plans include a 7-Day Free Trial
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-[2.5rem] p-10 border-2 transition-all duration-300 hover:scale-[1.02]
                ${plan.popular ? 'border-primary ring-4 ring-primary/5 shadow-2xl' : 'border-slate-100 shadow-xl'}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="space-y-8">
                {/* Icon & Title */}
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-${plan.color === 'primary' ? 'primary/10' : plan.color + '-100'} text-${plan.color === 'primary' ? 'primary' : plan.color + '-600'}`}>
                    <plan.icon size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                    {plan.requiresCard ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Required</span>
                    ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">No Card Needed</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 font-bold">/month</span>
                </div>

                <p className="text-slate-500 font-medium leading-relaxed">
                  {plan.description}
                </p>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-green-600 stroke-[3px]" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => handleSelect(plan)}
                  disabled={!!loading}
                  className={`
                    w-full py-6 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2
                    ${plan.popular 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    }
                  `}
                >
                  {loading === plan.id ? 'Loading...' : plan.buttonText}
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Style Footer */}
        <div className="text-center pt-10">
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            Trusted by 5,000+ businesses across Africa and the World 🌍
          </p>
        </div>
      </div>
    </div>
  )
}

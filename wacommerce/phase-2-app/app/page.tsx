'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Zap, BarChart3, ShieldCheck, Package, Users,
  CheckCircle, ArrowRight, ChevronRight, Star,
  Instagram, Facebook, Youtube, Twitter,
  Clock, TrendingUp, Bot, Smartphone, Gift
} from 'lucide-react'

// ─── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0)
  const [sub, setSub] = useState(0)
  const [rev, setRev] = useState(false)

  useEffect(() => {
    if (!rev && sub === texts[idx].length + 1) { setTimeout(() => setRev(true), 1800); return }
    if (rev && sub === 0) { setRev(false); setIdx(p => (p + 1) % texts.length); return }
    const t = setTimeout(() => setSub(p => p + (rev ? -1 : 1)), rev ? 40 : 95)
    return () => clearTimeout(t)
  }, [sub, idx, rev, texts])

  return (
    <span>
      {texts[idx].substring(0, sub)}
      <span className="inline-block w-0.5 h-[1em] bg-emerald-500 ml-0.5 align-middle animate-pulse" />
    </span>
  )
}

// ─── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-emerald-600 transition-colors">
            <MessageSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">Chatevo</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          <Link href="/affiliates/apply" className="hover:text-slate-900 transition-colors">Affiliates</Link>
          <Link href="/docs" className="hover:text-slate-900 transition-colors">Docs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
          <Link href="/sign-up" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Bot, title: 'AI Sales Agent', desc: 'Your WhatsApp number becomes a 24/7 AI agent that takes orders, answers questions, and processes payments automatically.' },
  { icon: Package, title: 'Product Catalog', desc: 'Add unlimited products with images, variants, and inventory tracking. Customers browse and buy without leaving WhatsApp.' },
  { icon: Smartphone, title: 'M-Pesa & Paybill', desc: 'Customers pay via MPesa, Paybill, or bank. You get notified, confirm, and the order is fulfilled — all in the same chat.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Track revenue, best-selling products, peak hours, and customer behavior in a clean dashboard built for mobile merchants.' },
  { icon: Users, title: 'Customer CRM', desc: 'Every customer becomes a contact with order history, chat history, and spend analytics automatically.' },
  { icon: Zap, title: 'Order Automation', desc: 'Auto-confirm payments, send tracking updates, trigger follow-ups, and recover abandoned carts — all automated.' },
]

const PLANS = [
  {
    name: 'Starter', price: 3500, color: 'slate',
    href: 'https://paystack.shop/pay/chatevo-starter',
    features: ['AI WhatsApp Bot', '50 Products', 'MPesa/Bank Payments', 'Order Management', 'Basic Analytics'],
  },
  {
    name: 'Growth', price: 7000, color: 'emerald', popular: true,
    href: 'https://paystack.shop/pay/chatevo-growth',
    features: ['Everything in Starter', 'Unlimited Products', 'Digital Product Delivery', 'Abandoned Cart Recovery', 'Custom Bot Persona', 'Bulk Broadcasts'],
  },
  {
    name: 'Elite', price: 13000, color: 'amber',
    href: 'https://paystack.shop/pay/chatevo-elite',
    features: ['Everything in Growth', '5 Team Members', 'API Access', 'Priority Support', 'White-label Option'],
  },
]

const TESTIMONIALS = [
  { name: 'Wanjiku M.', biz: 'Wanjiku\'s Fashion, Nairobi', text: 'I was manually replying to 40+ WhatsApp messages a day. Now Chatevo handles everything. I make more sales with less stress.', stars: 5 },
  { name: 'David O.', biz: 'Fresh Groceries, Mombasa', text: 'MPesa integration is exactly what I needed. My customers pay, I confirm, and they get their delivery info — all in one chat.', stars: 5 },
  { name: 'Sarah K.', biz: 'Digital Courses, Nairobi', text: 'For digital products it\'s incredible. Customer pays, AI sends the download link automatically. No manual work at all.', stars: 5 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">Now live — 7-day free trial</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
            Sell{' '}
            <span className="text-emerald-600">
              <Typewriter texts={['Smarter', 'Faster', 'via MPesa', 'on WhatsApp']} />
            </span>
            <br />on WhatsApp
          </h1>

          <p className="text-xl text-slate-500 mb-10 max-w-xl leading-relaxed">
            Chatevo turns your WhatsApp number into a fully automated AI store.
            Customers browse, order, and pay via M-Pesa — all inside chat, no app needed.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              Start free for 7 days <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-up/choose-plan"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              View pricing <ChevronRight size={16} />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-500" /> 7-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-500" /> Setup in 5 minutes</span>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Active stores' },
            { value: 'KES 2M+', label: 'Processed monthly' },
            { value: '4.9 / 5', label: 'Average rating' },
            { value: '< 3 min', label: 'Avg response time' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="mb-14">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">Everything you need</p>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Built for Kenyan merchants</h2>
          <p className="text-slate-500 mt-3 text-lg max-w-xl">
            Stop losing sales to ignored WhatsApp messages. Chatevo handles the full commerce flow automatically.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all bg-white">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">Simple setup</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Up in 5 minutes</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: '1', title: 'Create account', desc: 'Sign up, choose your plan, and set up your store name.' },
              { n: '2', title: 'Add products', desc: 'Upload your catalog with photos, prices, and descriptions.' },
              { n: '3', title: 'Connect WhatsApp', desc: 'Link your WhatsApp Business number via the Meta API.' },
              { n: '4', title: 'Start selling', desc: 'Share your store link. The AI handles every customer conversation.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-4">{s.n}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
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

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Loved by merchants</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.biz}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Ready to automate your sales?</h2>
          <p className="text-slate-500 mb-8">Set up in 5 minutes. No credit card needed for the free trial.</p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-sm text-base"
          >
            Start free for 7 days <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                  <MessageSquare size={15} className="text-white" />
                </div>
                <span className="font-bold text-white text-base tracking-tight">Chatevo</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[240px]">
                WhatsApp commerce made simple. Built for Kenyan merchants — M-Pesa, Paybill, and Bank all supported.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-3 mt-6">
                {[
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Youtube, label: 'YouTube' },
                  { icon: Twitter, label: 'TikTok' },
                ].map(s => (
                  <div key={s.label} className="relative group">
                    <div className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-not-allowed opacity-60 transition-colors">
                      <s.icon size={16} className="text-slate-400" />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Coming soon
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <p className="font-semibold text-white text-sm mb-4">Product</p>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/sign-up/choose-plan" className="hover:text-white transition-colors">Compare Plans</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="font-semibold text-white text-sm mb-4">Company</p>
              <ul className="space-y-3 text-sm">
                <li><Link href="/affiliates/apply" className="hover:text-white transition-colors">Affiliate Program</Link></li>
                <li><a href="mailto:support@chatevo.app" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Referral CTA */}
            <div>
              <p className="font-semibold text-white text-sm mb-4">Earn with Chatevo</p>
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Gift size={16} className="text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">Refer merchants and earn <strong className="text-emerald-400">30%</strong> on month 1, <strong className="text-emerald-400">10%</strong> on months 2–7.</p>
                <Link
                  href="/affiliates/apply"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Join affiliate program <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Chatevo Technologies · Sell Smarter on WhatsApp</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

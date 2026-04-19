'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, CreditCard, LayoutDashboard, CheckCircle2, MessageSquare, Zap, Globe, BarChart3, ArrowRight, X } from 'lucide-react'

const Typewriter = ({ texts }: { texts: string[] }) => {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [reverse, setReverse] = useState(false)

  useEffect(() => {
    if (subIndex === texts[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000)
      return
    }

    if (subIndex === 0 && reverse) {
      setReverse(false)
      setIndex((prev) => (prev + 1) % texts.length)
      return
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1))
    }, Math.max(reverse ? 50 : 100, Math.random() * 150))

    return () => clearTimeout(timeout)
  }, [subIndex, index, reverse, texts])

  return (
    <span>
      {texts[index].substring(0, subIndex)}
      <span className="animate-pulse border-r-4 border-primary ml-1" />
    </span>
  )
}

const LiveActivity = () => {
  const [visible, setVisible] = useState(false)
  const [activity, setActivity] = useState({ name: 'Sarah', location: 'Nairobi', action: 'launched their store' })
  
  const activities = [
    { name: 'Sarah', location: 'Nairobi', action: 'launched their store' },
    { name: 'David', location: 'Lagos', action: 'just processed an order' },
    { name: 'Amara', location: 'Accra', action: 'upgraded to Growth' },
    { name: 'John', location: 'London', action: 'just connected WhatsApp' },
    { name: 'Elena', location: 'Cape Town', action: 'added 50 products' },
  ]

  useEffect(() => {
    const show = () => {
      setActivity(activities[Math.floor(Math.random() * activities.length)])
      setVisible(true)
      setTimeout(() => setVisible(false), 5000)
    }

    const interval = setInterval(show, 15000)
    setTimeout(show, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-8 left-8 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-sm">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {activity.name[0]}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#075E54]">
            {activity.name} from {activity.location}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
            {activity.action} · 2m ago
          </p>
        </div>
        <button onClick={() => setVisible(false)} className="text-slate-300 hover:text-slate-500">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

const WhatsAppWalkthrough = () => {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  const steps = [
    {
      title: 'Storefront',
      subtitle: 'Customer browses catalog',
      content: (
        <div className="space-y-3">
          <div className="bg-card p-3 rounded-xl rounded-tl-none shadow-sm text-[10px] w-3/4">Welcome to our store! 👋 Check our latest drop.</div>
          <div className="bg-card p-2 rounded-2xl shadow-lg border border-slate-50">
            <div className="aspect-square bg-slate-100 rounded-lg mb-2" />
            <div className="h-2 w-3/4 bg-slate-200 rounded-full mb-1" />
            <div className="h-3 w-1/2 bg-primary/20 rounded-full" />
          </div>
        </div>
      )
    },
    {
      title: 'Cart',
      subtitle: 'Items added via chat',
      content: (
        <div className="space-y-3">
          <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none shadow-sm text-[10px] w-3/4 ml-auto">I want to order the Silk Shirt in Blue.</div>
          <div className="bg-card p-3 rounded-xl rounded-tl-none shadow-sm text-[10px] w-3/4">Great choice! Added to your cart. 🛒</div>
          <div className="bg-card p-4 rounded-xl border border-primary/20 shadow-md flex items-center gap-3">
             <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary italic font-serif text-[10px]">S</div>
             <div className="flex-1">
                <div className="h-2 w-20 bg-slate-200 rounded-full mb-1" />
                <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
             </div>
             <div className="text-[10px] font-black text-primary">$45.00</div>
          </div>
        </div>
      )
    },
    {
      title: 'Checkout',
      subtitle: 'Secure delivery details',
      content: (
        <div className="space-y-3">
          <div className="bg-card p-3 rounded-xl rounded-tl-none shadow-sm text-[10px] w-3/4">Please provide your delivery address below.</div>
          <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none shadow-sm text-[10px] w-3/4 ml-auto">House 42, Victoria Island, Lagos.</div>
          <div className="bg-card p-3 rounded-xl rounded-tl-none shadow-sm text-[10px] w-3/4 italic">Calculating delivery fee... 🚚</div>
        </div>
      )
    },
    {
      title: 'Confirmation',
      subtitle: 'Instant payment & sync',
      content: (
        <div className="space-y-3">
          <div className="bg-card p-3 rounded-xl rounded-tl-none shadow-sm text-[10px] w-full border-l-4 border-primary">
            ✅ Order #7721 Confirmed! <br />
            Total: $45.00 <br />
            <button className="mt-2 w-full bg-primary text-white py-2 rounded-lg font-bold text-[10px]">Pay via Paystack</button>
          </div>
          <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none shadow-sm text-[10px] w-3/4 ml-auto">Paid! Thank you.</div>
        </div>
      )
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setStep((prev) => (prev + 1) % steps.length)
        setAnimating(false)
      }, 500)
    }, 4000)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-indigo-500/20 blur-2xl rounded-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
      <div className="relative bg-[#111B21] rounded-[50px] p-4 shadow-2xl overflow-hidden aspect-[9/18.5] border-[6px] border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-3xl z-10" />
        <div className="h-full bg-[#ECE5DD] rounded-[32px] overflow-hidden flex flex-col relative">
          <div className="bg-[#075E54] p-6 pt-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card/20 flex items-center justify-center text-white font-bold text-lg">S</div>
            <div className="flex-1">
              <div className="h-3 w-24 bg-card/40 rounded-full mb-1" />
              <div className="text-[10px] text-white/60 font-medium">Online</div>
            </div>
          </div>
          
          <div className={`flex-1 p-5 space-y-4 transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {steps[step].content}
          </div>

          <div className="p-4 bg-card/80 backdrop-blur-md flex items-center gap-2">
             <div className="flex-1 h-10 bg-card rounded-full border border-slate-200 px-4 flex items-center text-slate-300 text-xs">Message...</div>
             <div className="w-10 h-10 bg-[#075E54] rounded-full flex items-center justify-center text-white">
                <Zap size={18} fill="currentColor" />
             </div>
          </div>

          <div className="absolute top-24 right-4 flex flex-col gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-primary h-4' : 'bg-primary/20'}`} />
            ))}
          </div>
        </div>
      </div>
      
      <div className="absolute -right-8 bottom-12 bg-card rounded-2xl p-4 shadow-xl border border-primary/10 max-w-[200px] animate-bounce">
         <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{steps[step].title}</p>
         <p className="text-[11px] font-bold text-slate-500">{steps[step].subtitle}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-card text-slate-900 selection:bg-primary/30 selection:text-primary-foreground font-sans overflow-x-hidden">
      <LiveActivity />
      
      {/* Premium Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-card/70 backdrop-blur-2xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white font-serif font-black text-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">S</div>
              <span className="font-serif font-black text-2xl tracking-tighter text-[#075E54]">Chatevo</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
              <Link href="#themes" className="hover:text-primary transition-colors">Themes</Link>
              <Link href="/docs" className="hover:text-primary transition-colors">Docs</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-[#075E54] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
              Log In
            </Link>
            <Link 
              href="/sign-up/choose-plan" 
              className="bg-[#075E54] text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-primary/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <nav className="fixed top-0 w-full z-50 transition-all border-b border-white/5 bg-black/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
              <span className="text-primary-foreground font-black text-xl font-serif">S</span>
            </div>
            <span className="font-serif font-black text-2xl tracking-tighter italic">Chatevo</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 mr-auto ml-12">
            {['Features', 'Pricing', 'Demo'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors tracking-tight">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground font-semibold text-sm transition-colors uppercase tracking-widest">
              Sign In
            </Link>
            <Link
              href="/sign-up/choose-plan"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 tracking-tight shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-32 grid lg:grid-cols-2 gap-24 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-5 py-2 mb-10 group cursor-default">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
              <span className="text-primary text-xs font-black tracking-[0.2em] uppercase">Phase 2 Premium · Invitation Only</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif font-black mb-6 leading-[0.9] tracking-tight text-[#075E54]">
              Sell <br />
              <span className="text-primary italic">
                <Typewriter texts={['Easily', 'Faster', 'Smart', 'Global']} />
              </span> <br />
              on WhatsApp
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-xl font-medium leading-relaxed">
              The professional way to sell products directly inside chat. 
              Let your customers checkout without leaving WhatsApp. 
              Built for speed. Loved by merchants.
            </p>

            <div className="flex flex-wrap gap-5">
              <Link
                href="/sign-up/choose-plan"
                className="bg-primary text-primary-foreground px-12 py-6 rounded-full font-black text-lg hover:opacity-95 transition-all flex items-center gap-2 group shadow-xl shadow-primary/20 tracking-tight"
              >
                Create Your Store <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/store/demo"
                className="bg-card text-primary px-10 py-5 rounded-full font-black text-lg border border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
              >
                Watch Demo
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-4 text-muted-foreground text-sm font-bold">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                    U{i}
                  </div>
                ))}
              </div>
              Join 1,000+ professional merchants
            </div>
          </div>

          <div className="flex justify-center">
            <WhatsAppWalkthrough />
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-6 py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 border-b border-white/10 pb-12">
            <div>
              <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-none text-[#075E54]">
                Everything <br />
                <span className="text-primary italic">Automated.</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md font-medium text-lg mb-4">
              Stop manually taking orders. Chatevo handles everything from catalog to confirmation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'AI Catalog', desc: 'Sync your products and let AI handle customer questions.', icon: <Zap className="w-6 h-6" /> },
              { title: 'Safe Checkout', desc: 'Secure payment links sent directly in WhatsApp.', icon: <CreditCard className="w-6 h-6" /> },
              { title: 'Global Reach', desc: 'Sell to anyone, anywhere in their native currency.', icon: <Globe className="w-6 h-6" /> },
            ].map((f, i) => (
              <div key={i} className="bg-card p-12 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-serif font-black mb-4 text-[#075E54]">{f.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-24">
             <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tight mb-8 text-[#075E54]">Simple <span className="text-primary italic">Pricing.</span></h2>
             <p className="text-muted-foreground max-w-2xl mx-auto text-xl font-medium">No hidden fees. Just professional tools to grow your brand.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: 'Starter', price: '29', popular: false, trial: '7-Day Free Trial', desc: 'Perfect for new merchants starting their journey.',
                features: ['1 Store', '50 Products', 'Basic Analytics', 'WhatsApp Catalog'] 
              },
              { 
                name: 'Pro', price: '59', popular: true, trial: '7 Days Free', desc: 'Our most popular plan for established brands.',
                features: ['3 Stores', '500 Products', 'Advanced Analytics', 'Priority Support', 'Custom Themes'] 
              },
              { 
                name: 'Elite', price: '99', popular: false, trial: '7 Days Free', desc: 'Enterprise-grade features for high-volume stores.',
                features: ['Unlimited Products', 'API Access', 'Dedicated Manager', 'White-labeling', 'Advanced AI'] 
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-12 rounded-[50px] border transition-all ${plan.popular ? 'bg-[#075E54] text-white shadow-2xl scale-105 z-10' : 'bg-card border-slate-100 shadow-sm'}`}>
                {plan.popular && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    Best Value
                  </div>
                )}
                
                <div className="mb-10">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-60">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-serif font-black">${plan.price}</span>
                    <span className="text-sm font-bold opacity-60">/mo</span>
                  </div>
                </div>

                <div className="mb-10 min-h-[60px]">
                  <p className={`text-sm font-bold mb-2 ${plan.popular ? 'opacity-90' : 'text-[#075E54]'}`}>
                    {plan.trial}
                  </p>
                  <p className={`text-xs font-medium leading-relaxed ${plan.popular ? 'opacity-70' : 'text-muted-foreground'}`}>
                    {plan.desc}
                  </p>
                </div>

                <div className="space-y-4 mb-12">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${plan.popular ? 'bg-card/20 border-white/30' : 'bg-primary/10 border-primary/20'}`}>
                        <CheckCircle2 className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${plan.popular ? 'opacity-80' : 'text-slate-500'}`}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/sign-up/choose-plan"
                  className={`block w-full text-center py-5 rounded-full font-serif font-black text-lg transition-all ${
                    plan.popular 
                      ? 'bg-card text-primary hover:bg-slate-50' 
                      : 'bg-[#075E54] text-white hover:opacity-90'
                  }`}
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-40 bg-[#111B21] rounded-[60px] p-12 md:p-24 overflow-hidden relative border border-white/5">
             <div className="grid lg:grid-cols-2 gap-20 items-center">
               <div>
                  <h2 className="text-4xl md:text-6xl font-serif font-black text-white mb-8 leading-[0.9] tracking-tight">
                    Your Brand, <br />
                    <span className="text-primary italic">Your Identity.</span>
                  </h2>
                  <p className="text-muted-foreground/70 font-medium mb-12 max-w-md leading-relaxed">
                    Chatevo adapts to your aesthetic. Choose from 10+ professional themes or create your own signature palette.
                  </p>
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-primary opacity-20 hover:opacity-100 cursor-pointer transition-all border border-white/10 hover:scale-110" />
                    ))}
                  </div>
               </div>
               <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full group-hover:bg-primary/30 transition-all" />
                  <div className="relative bg-card/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-2xl">
                    <div className="h-64 w-full bg-slate-100 rounded-[30px] animate-pulse mb-6" />
                    <div className="space-y-3">
                      <div className="h-4 w-1/2 bg-card/10 rounded-full" />
                      <div className="h-4 w-3/4 bg-card/10 rounded-full" />
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-slate-100 py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold font-serif text-xl">S</div>
              <span className="font-serif font-black text-2xl tracking-tight text-[#075E54]">Chatevo</span>
            </div>
            <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
              The professional way to sell on WhatsApp. Built for modern merchants who value speed and customer experience.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#075E54] text-sm uppercase tracking-widest">Product</h4>
            <ul className="space-y-4 text-muted-foreground font-medium text-sm">
              <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-primary transition-colors">Live Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#075E54] text-sm uppercase tracking-widest">Connect</h4>
            <ul className="space-y-4 text-muted-foreground font-medium text-sm">
              <li><a href="mailto:mazaoedu@gmail.com" className="hover:text-primary transition-colors">mazaoedu@gmail.com</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between text-muted-foreground text-xs font-bold tracking-tight gap-4">
          <p>© 2026 Chatevo TECHNOLOGIES INC.</p>
          <div className="flex gap-10">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}


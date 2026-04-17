import Link from 'next/link'
import { Typewriter } from './Typewriter'

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-emerald-700">Now live in Kenya</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8">
          Sell Smarter on{' '}
          <span className="text-emerald-500 block md:inline">
            <Typewriter texts={['WhatsApp.', 'Auto-Pilot.', 'M-Pesa.']} />
          </span>
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto px-4">
          Transform your WhatsApp into a professional store. Automate orders, payments, and 24/7 customer support with Chatevo.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95 text-center">
            Start 7-day free trial
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all text-center">
            See how it works
          </a>
        </div>
        <div className="mt-16 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale group hover:grayscale-0 transition-all duration-500">
          <div className="text-xl font-black tracking-tighter">M-PESA</div>
          <div className="text-xl font-black tracking-tighter">PAYSTACK</div>
          <div className="text-xl font-black tracking-tighter">CHATEVO</div>
        </div>
      </div>
    </section>
  )
}

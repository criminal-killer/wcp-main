import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100 py-16 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 mb-6 group">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <MessageSquare size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Chatevo</span>
          </Link>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            The intelligent WhatsApp commerce platform for the modern Kenyan merchant. Sell smarter, not harder.
          </p>
          <div className="flex gap-4">
            <div className="group relative">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">FB</div>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
            </div>
            <div className="group relative">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">IG</div>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
            </div>
            <div className="group relative">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">X</div>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-5">Product</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
            <li><Link href="/docs" className="hover:text-emerald-600 transition-colors">Documentation</Link></li>
            <li><Link href="/affiliates/apply" className="hover:text-emerald-600 transition-colors">Affiliate Program</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-5">Company</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><Link href="/about" className="hover:text-emerald-600 transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-5">Subscribe</h4>
          <p className="text-sm text-slate-500 mb-4">Get the latest updates on selling on WhatsApp.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors whitespace-nowrap">Join</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-12 mt-12 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-400">© 2024 Chatevo. All rights reserved. Built with ❤️ in Kenya.</p>
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> System Operational
        </p>
      </div>
    </footer>
  )
}

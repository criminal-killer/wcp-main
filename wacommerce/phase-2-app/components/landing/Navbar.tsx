'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export function Navbar() {
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

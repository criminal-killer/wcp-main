'use client'
import { useState } from 'react'
import {
  BookOpen, Terminal, Zap, CreditCard, MessageSquare, ShoppingCart,
  Users, Globe, Settings, ChevronRight, ChevronDown, Copy, Check,
  ExternalLink, ArrowRight, Search, HelpCircle, Mail, Play, Video,
  BarChart3, Bell, Code, Hash, Package, Layers, Plus, Smartphone, User,
  Phone
} from 'lucide-react'

type Section = {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

type Page = {
  id: string
  title: string
  icon: React.ElementType
  sections: Section[]
}

// Docs content following code.claude.com style
const PAGES: Record<string, Page> = {
  'quickstart': {
    id: 'quickstart',
    title: 'Quick Start',
    icon: Play,
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        icon: BookOpen,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Chatevo turns your WhatsApp into a 24/7 AI-powered sales store. Customers browse your catalog, add to cart, and pay — all through WhatsApp messages. No app downloads required.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// 3 steps to launch</div>
              <div className="space-y-2 font-mono text-sm">
                <div><span className="text-emerald-400">1.</span> <span className="text-slate-200">Connect your WhatsApp Business number</span></div>
                <div><span className="text-emerald-400">2.</span> <span className="text-slate-200">Add your products and categories</span></div>
                <div><span className="text-emerald-400">3.</span> <span className="text-slate-200">Share your store link and start selling</span></div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'connect-wa',
        title: 'Connect WhatsApp',
        icon: MessageSquare,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Link your WhatsApp Business number via Meta. This enables the AI to receive and respond to customer messages automatically.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Webhook URL</div>
              <div className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3">
                <code className="text-emerald-400 text-sm font-mono">https://app.chatevo.io/api/webhook</code>
                <button className="text-slate-400 hover:text-white p-1">
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-medium">
                In your Meta Developer Console, subscribe to the <code className="bg-amber-500/20 px-2 py-0.5 rounded">messages</code> webhook field.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  'products': {
    id: 'products',
    title: 'Products & Catalog',
    icon: Package,
    sections: [
      {
        id: 'add-products',
        title: 'Adding Products',
        icon: Plus,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Products are organized by categories. Each product can have variants (size, color) and multiple images. The AI uses your categories to help customers browse.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { type: 'Physical', desc: 'Tangible goods', color: 'blue' },
                { type: 'Digital', desc: 'Files, courses, ebooks', color: 'purple' },
                { type: 'Services', desc: 'Bookings, appointments', color: 'green' },
              ].map(p => (
                <div key={p.type} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-mono text-slate-400 uppercase">{p.type}</span>
                  <p className="text-sm text-slate-300 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'categories',
        title: 'Categories',
        icon: Layers,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Organize products into categories and subcategories. These guide the AI flow when customers browse your store.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Example structure</div>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-slate-200">Clothing</div>
                <div className="pl-4 text-slate-400">- Tops</div>
                <div className="pl-4 text-slate-400">- Pants</div>
                <div className="pl-4 text-slate-400">- Shoes</div>
                <div className="text-slate-200 mt-2">Electronics</div>
                <div className="pl-4 text-slate-400">- Phones</div>
                <div className="pl-4 text-slate-400">- Accessories</div>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  'payments': {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    sections: [
      {
        id: 'paystack',
        title: 'Paystack',
        icon: Zap,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Recommended for Africa. Supports M-Pesa, bank transfers, and card payments across Nigeria, Kenya, Ghana, and South Africa.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Features</div>
              <div className="grid grid-cols-2 gap-4">
                {['M-Pesa', 'Card Payments', 'Bank Transfer', 'Instant Settlement'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-sm text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'mpesa',
        title: 'M-Pesa Flow',
        icon: Smartphone,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Customers send payment via M-Pesa, then type "paid" in WhatsApp. The AI auto-confirms their order instantly.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Flow</div>
              <div className="flex items-center gap-4">
                {['Order', 'Pay', 'Confirm', 'Done'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-mono text-slate-400">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-300">{step}</span>
                    {i < 3 && <ChevronRight size={14} className="text-slate-600 mx-2" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  'ai': {
    id: 'ai',
    title: 'AI Sales Agent',
    icon: Zap,
    sections: [
      {
        id: 'greeting',
        title: 'Custom Greeting',
        icon: MessageSquare,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Set a custom greeting that appears when customers first message your store. Keep it short, friendly, and under 2 sentences.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Example</div>
              <p className="text-slate-200 text-sm italic font-mono">
                "Hey! Welcome to Sarah's Boutique. What are you looking for today?"
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'persona',
        title: 'AI Persona',
        icon: User,
        content: (
          <div className="space-y-3">
            {[
              { name: 'General', desc: 'Helpful assistant mode — answers questions, guides browsing, provides product info', tag: 'Default' },
              { name: 'Sales', desc: 'Active sales mode — recommends products, highlights deals, nudges toward checkout', tag: 'Conversion' },
            ].map(p => (
              <div key={p.name} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{p.name}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase font-mono">{p.tag}</span>
                </div>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  'analytics': {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    sections: [
      {
        id: 'overview',
        title: 'Dashboard Overview',
        icon: BarChart3,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Track your store performance with real-time metrics. Monitor orders, revenue, customer engagement, and product performance.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Orders Today', 'Revenue', 'Total Customers', 'Products Sold'].map(m => (
                <div key={m} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-500 uppercase">{m}</span>
                  <div className="text-xl font-bold text-slate-200 mt-1">--</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  'notifications': {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    sections: [
      {
        id: 'setup',
        title: 'Setup',
        icon: Bell,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Receive instant notifications when customers place orders, confirm payments, or need attention.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Notification types</div>
              <div className="space-y-2">
                {['New Order', 'Payment Confirmed', 'Customer Message', 'Abandoned Cart'].map(n => (
                  <div key={n} className="flex items-center gap-3">
                    <Bell size={14} className="text-slate-500" />
                    <span className="text-sm text-slate-300">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  'api': {
    id: 'api',
    title: 'API Reference',
    icon: Code,
    sections: [
      {
        id: 'webhooks',
        title: 'Webhooks',
        icon: Code,
        content: (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Receive real-time events for orders, payments, and customer actions. Verify signatures before processing.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <div className="text-slate-400 text-xs font-mono mb-3">// Endpoint</div>
              <code className="text-emerald-400 text-sm font-mono block">POST /api/webhook</code>
              <div className="text-slate-500 text-xs mt-3">Content-Type: application/json</div>
            </div>
          </div>
        ),
      },
    ],
  },
}

export default function DocsPage() {
  const [activePage, setActivePage] = useState('quickstart')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'overview': true,
    'connect-wa': true,
  })

  const page = PAGES[activePage] || PAGES['quickstart']

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left Sidebar - code.claude.com style */}
      <aside className="w-64 shrink-0 bg-[#111827] border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-200">Chatevo Docs</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search docs..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">Getting Started</p>
            {['quickstart', 'products', 'payments'].map(id => {
              const p = PAGES[id]
              return (
                <button
                  key={id}
                  onClick={() => setActivePage(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-1 ${
                    activePage === id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <p.icon size={14} className={activePage === id ? 'text-emerald-400' : 'text-slate-500'} />
                  {p.title}
                </button>
              )
            })}
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">Features</p>
            {['ai', 'analytics', 'notifications'].map(id => {
              const p = PAGES[id]
              return (
                <button
                  key={id}
                  onClick={() => setActivePage(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-1 ${
                    activePage === id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <p.icon size={14} className={activePage === id ? 'text-emerald-400' : 'text-slate-500'} />
                  {p.title}
                </button>
              )
            })}
          </div>

          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">Reference</p>
            {['api'].map(id => {
              const p = PAGES[id]
              return (
                <button
                  key={id}
                  onClick={() => setActivePage(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-1 ${
                    activePage === id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <p.icon size={14} className={activePage === id ? 'text-emerald-400' : 'text-slate-500'} />
                  {p.title}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <a href="mailto:mazaoedu@gmail.com"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all">
            <HelpCircle size={14} />
            Get Help
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-[#0A0A0F] overflow-y-auto">
        <div className="max-w-3xl mx-auto p-10">
          {/* Page Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center">
              <page.icon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{page.title}</h1>
            </div>
          </div>

          {/* Sections - Collapsible */}
          <div className="space-y-3">
            {page.sections.map(section => (
              <div key={section.id} className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={16} className="text-slate-500" />
                    <span className="text-sm font-semibold text-slate-200">{section.title}</span>
                  </div>
                  {expandedSections[section.id] ? (
                    <ChevronDown size={16} className="text-slate-500" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-500" />
                  )}
                </button>
                {expandedSections[section.id] && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800/50">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex items-center justify-between">
            <button className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowRight size={14} className="rotate-180" />
              Previous
            </button>
            <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import {
  BookOpen, Terminal, Zap, CreditCard, MessageSquare, ShoppingCart,
  Users, Globe, Settings, ChevronRight, ChevronDown, Copy, Check,
  ExternalLink, ArrowRight, Search, HelpCircle, Mail
} from 'lucide-react'

type DocPage = {
  id: string
  title: string
  icon: React.ElementType
  description: string
  sections: DocSection[]
}

type DocSection = {
  id: string
  title: string
  content: React.ReactNode
}

const DOCS: Record<string, DocPage> = {
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Set up your WhatsApp store in minutes.',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Chatevo turns your WhatsApp number into a 24/7 AI-powered sales store. Customers browse products, add to cart, and pay — all through WhatsApp messages. No app download required.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Connect WA', desc: 'Link your WhatsApp Business number' },
                { label: 'Add Products', desc: 'Upload products with prices' },
                { label: 'Go Live', desc: 'AI handles the rest automatically' },
              ].map((step, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{step.label}</span>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'quick-setup',
        title: 'Quick Setup Checklist',
        content: (
          <div className="space-y-3">
            <p className="text-[13px] text-slate-500 font-medium">Complete these steps to launch your store:</p>
            <div className="space-y-2">
              {[
                { step: '01', title: 'Connect WhatsApp', desc: 'Link your Business number via Meta' },
                { step: '02', title: 'Add Products', desc: 'Create at least 5 products with categories' },
                { step: '03', title: 'Configure Payments', desc: 'Set up Paystack or PayPal integration' },
                { step: '04', title: 'Customize AI', desc: 'Set your store greeting and persona' },
                { step: '05', title: 'Test & Launch', desc: 'Test your store with a friend' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-4 p-3 bg-white border border-slate-100 rounded-xl hover:border-primary/20 transition-all">
                  <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{item.step}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  'whatsapp-setup': {
    id: 'whatsapp-setup',
    title: 'WhatsApp Setup',
    icon: MessageSquare,
    description: 'Connect your WhatsApp Business number to the platform.',
    sections: [
      {
        id: 'meta-setup',
        title: 'Step 1: Meta Business Account',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              You need a Meta Business account to access the WhatsApp Cloud API. This is free and takes about 10 minutes.
            </p>
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
              <div className="text-slate-400 mb-2">{`// What you need from Meta:`}</div>
              <div><span className="text-emerald-400">1.</span> Phone Number ID</div>
              <div><span className="text-emerald-400">2.</span> WhatsApp Business Account ID (WABA ID)</div>
              <div><span className="text-emerald-400">3.</span> System User Access Token</div>
            </div>
            <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-bold text-primary hover:underline">
              Open Meta Business <ExternalLink size={12} />
            </a>
          </div>
        ),
      },
      {
        id: 'webhook',
        title: 'Step 2: Configure Webhook',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Add this webhook URL in your Meta WhatsApp API settings:
            </p>
            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between gap-2">
              <code className="text-[11px] text-emerald-400 font-mono truncate">
                https://app.chatevo.io/api/webhook
              </code>
              <button onClick={() => navigator.clipboard.writeText('https://app.chatevo.io/api/webhook')}
                className="text-slate-400 hover:text-white shrink-0">
                <Copy size={14} />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[11px] text-amber-800 font-bold">
                Important: Subscribe to the <code className="bg-amber-100 px-1 rounded">messages</code> field in your webhook configuration.
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
    icon: ShoppingCart,
    description: 'Manage your product catalog and categories.',
    sections: [
      {
        id: 'add-products',
        title: 'Adding Products',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Products are grouped by categories. When you add products, the AI uses your categories to guide customers through browsing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { type: 'Physical', desc: 'Tangible goods — clothes, electronics, food', icon: '1' },
                { type: 'Digital', desc: 'Files delivered instantly — ebooks, courses', icon: '2' },
                { type: 'Services', desc: 'Bookings and appointments', icon: '3' },
              ].map(p => (
                <div key={p.type} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded flex items-center justify-center text-[10px] font-black">{p.icon}</span>
                    <span className="text-sm font-bold text-slate-800">{p.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{p.desc}</p>
                </div>
              ))}
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
    description: 'Collect payments via M-Pesa, Card, or PayPal.',
    sections: [
      {
        id: 'paystack',
        title: 'Paystack (Recommended for Africa)',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Paystack supports M-Pesa, bank transfers, and card payments across Nigeria, Kenya, Ghana, and South Africa.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Setup Location</span>
                <span className="font-bold text-slate-700">Dashboard &gt; Settings &gt; Payments</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Integration</span>
                <span className="font-bold text-slate-700">Automatic (Chatevo handles everything)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Settlement</span>
                <span className="font-bold text-slate-700">Direct to your bank account</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'mpesa',
        title: 'M-Pesa (Kenya)',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Customers send payment via M-Pesa to your number, then type "paid" in WhatsApp. The AI auto-confirms the order.
            </p>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-[11px] text-green-800 font-bold mb-2">How it works:</p>
              <ol className="text-[11px] text-green-700 font-medium space-y-1 list-decimal list-inside">
                <li>Customer checks out and gets payment instructions</li>
                <li>Customer sends M-Pesa to your business number</li>
                <li>Customer replies "paid" in WhatsApp</li>
                <li>AI confirms the order instantly</li>
              </ol>
            </div>
          </div>
        ),
      },
    ],
  },
  'ai-config': {
    id: 'ai-config',
    title: 'AI Settings',
    icon: Zap,
    description: 'Customize your AI sales agent personality and behavior.',
    sections: [
      {
        id: 'greeting',
        title: 'Custom Greeting',
        content: (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Set a custom greeting that appears when customers message your store. Keep it short and friendly.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Example Greeting</p>
              <p className="text-sm text-slate-700 font-medium italic">
                "Hey there! Welcome to Sarah's Boutique. What are you looking for today?"
              </p>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Setting location: Dashboard &gt; Settings &gt; AI Sales Agent &gt; Custom Greeting
            </p>
          </div>
        ),
      },
      {
        id: 'persona',
        title: 'AI Persona',
        content: (
          <div className="space-y-3">
            {[
              { name: 'Educator', desc: 'Great for onboarding and explaining complex products', tag: 'Default' },
              { name: 'Sales', desc: 'Aggressive, persuasive, and focused on closing deals', tag: 'Conversion' },
              { name: 'Friendly', desc: 'Casual, warm, and conversational style', tag: 'Casual' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{p.name}</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">{p.tag}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
}

export default function DocsPage() {
  const [activePage, setActivePage] = useState('getting-started')
  const [openSections, setOpenSections] = useState<string[]>(['overview'])

  const page = DOCS[activePage] || DOCS['getting-started']

  function toggleSection(id: string) {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Left Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-100 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-lg font-black text-slate-900 italic font-serif">Docs</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Chatevo v2.0</p>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search docs..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <nav className="space-y-1">
          {Object.values(DOCS).map(doc => (
            <button
              key={doc.id}
              onClick={() => { setActivePage(doc.id); setOpenSections([doc.sections[0]?.id || '']) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                activePage === doc.id
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <doc.icon size={14} className="shrink-0" />
              {doc.title}
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <a href="mailto:mazaoedu@gmail.com"
            className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors">
            <HelpCircle size={12} />
            Get Help
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <page.icon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{page.title}</h2>
                <p className="text-[12px] text-slate-400 font-medium">{page.description}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {page.sections.map(section => (
              <div key={section.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-800">{section.title}</span>
                  {openSections.includes(section.id) ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>
                {openSections.includes(section.id) && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-50">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <a href="/dashboard/docs" className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
              <ArrowRight size={12} className="rotate-180" /> Back to start
            </a>
            <a href="mailto:mazaoedu@gmail.com"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-2">
              Need help? <Mail size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
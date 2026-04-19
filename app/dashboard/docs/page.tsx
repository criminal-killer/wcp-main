'use client'
import { useState } from 'react'
import { 
  BookOpen, Rocket, MessageSquare, Zap, CreditCard, 
  ChevronRight, ExternalLink, ShieldCheck, Mail, Terminal,
  Lightbulb, HelpCircle, CheckCircle
} from 'lucide-react'

const SECTIONS = [
  { 
    id: 'getting-started', 
    title: 'Getting Started', 
    icon: Rocket,
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed font-medium">Welcome to Chatevo! 🚀 This guide will help you launch your automated WhatsApp store in minutes. Our platform is designed to turn your WhatsApp number into a 24/7 sales machine.</p>
        
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
           <h4 className="flex items-center gap-2 text-emerald-800 font-black uppercase tracking-widest text-xs mb-3">
             <CheckCircle size={16} /> Quick Checklist
           </h4>
           <ul className="space-y-3 text-sm text-emerald-900/80 font-bold">
             <li className="flex items-start gap-2"><span>1.</span> Register your Meta Business Account</li>
             <li className="flex items-start gap-2"><span>2.</span> Connect your WhatsApp Phone ID</li>
             <li className="flex items-start gap-2"><span>3.</span> Add your first 5 products</li>
             <li className="flex items-start gap-2"><span>4.</span> Configure your AI Sales Agent</li>
           </ul>
        </div>

        <h3 className="text-xl font-bold italic font-serif text-primary mt-8">The Onboarding Flow</h3>
        <p className="text-sm text-slate-500 font-medium">Once you sign up, your account enters a "Pending Approval" state. Our team verified every merchant to maintain platform quality. Once approved, you gain full access to the dashboard.</p>
      </div>
    )
  },
  { 
    id: 'whatsapp-setup', 
    title: 'WhatsApp Cloud API', 
    icon: MessageSquare,
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed font-medium">Chatevo uses the official WhatsApp Cloud API to handle messages. This ensures your number is never banned and your messages are delivered instantly.</p>
        
        <div className="space-y-8">
          <div className="relative pl-8 border-l-2 border-slate-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
            <h4 className="font-black text-slate-900 text-sm italic">Step 1: Meta Developers Console</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">Go to <a href="https://developers.facebook.com" target="_blank" className="text-primary underline">developers.facebook.com</a>, create a "Business" app, and add the "WhatsApp" product to your app.</p>
          </div>

          <div className="relative pl-8 border-l-2 border-slate-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
            <h4 className="font-black text-slate-900 text-sm italic">Step 2: Get Credentials</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">In the API Setup tab, you will find your **Phone Number ID**. You also need to generate a **Permanent System Access Token** in your Meta Business Settings.</p>
          </div>

          <div className="relative pl-8 border-l-2 border-slate-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
            <h4 className="font-black text-slate-900 text-sm italic">Step 3: Webhook Configuration</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">Enter your Chatevo Webhook URL in Meta. Ensure you subscribe to the **"messages"** field in the Webhook fields management section.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mt-8">
           <div className="flex items-center gap-2 text-amber-800 mb-2">
             <Terminal size={18} />
             <h4 className="font-black uppercase tracking-widest text-[10px]">Technical Note</h4>
           </div>
           <p className="text-xs text-amber-900/70 font-bold leading-relaxed">WhatsApp Cloud API requires a clean phone number that is NOT currently used on a standard WhatsApp phone app. If your number is on a phone, you must delete the account from the phone first.</p>
        </div>
      </div>
    )
  },
  { 
    id: 'ai-config', 
    title: 'AI Intelligence', 
    icon: Zap,
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed font-medium">Chatevo is powered by an advanced AI engine that understands customer intent and handles sales autonomously.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-slate-50 rounded-2xl p-6 shadow-sm">
            <h4 className="font-black text-primary text-sm mb-2">Chatevo Default AI</h4>
            <p className="text-xs text-slate-500 font-bold">Standard on all plans. Powered by **Groq (Llama-3)** for lightning-fast responses. No configuration required.</p>
          </div>
          <div className="bg-white border-2 border-primary/10 rounded-2xl p-6 shadow-sm">
            <h4 className="font-black text-primary text-sm mb-2">Bring Your Own LLM</h4>
            <p className="text-xs text-slate-500 font-bold">Connect Gemini, Claude, or GPT models. Provides deeper reasoning and custom personality control.</p>
          </div>
        </div>

        <h3 className="text-xl font-bold italic font-serif text-primary mt-8">Choosing a Persona</h3>
        <div className="space-y-4">
          {[
            { tag: 'Educator', desc: 'Default mode. Best for onboarding and complex product explanations.' },
            { tag: 'Sales', desc: 'Aggressive conversion mode. Direct, persuasive, and closes deals fast.' },
            { tag: 'Support', desc: 'Patient and empathetic. Best for handling complaints and policies.' }
          ].map(p => (
            <div key={p.tag} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter min-w-[70px] text-center">{p.tag}</span>
              <p className="text-xs text-slate-600 font-bold">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  { 
    id: 'payments', 
    title: 'Payments & Revenue', 
    icon: CreditCard,
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed font-medium">Collect payments directly via WhatsApp. Chatevo automatically generates checkout links and tracks order status.</p>
        
        <div className="space-y-4">
          <div className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black italic">P.</div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Paystack Integration</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">Best for African markets (Nigeria, Kenya, Ghana, SA). Supports M-Pesa, Card, and Bank Transfer.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">PP</div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">PayPal Business</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">Best for global customers. Requires a verified PayPal Business email.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
]

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('getting-started')

  const activeSection = SECTIONS.find(s => s.id === activeTab)

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-2 sticky top-8 h-fit">
          <div className="px-4 mb-6">
            <h1 className="text-2xl font-black text-primary italic font-serif">Chatevo Nexus</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Platform Documentation</p>
          </div>
          
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === s.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <s.icon size={18} />
              {s.title}
              <ChevronRight size={14} className={`ml-auto transition-transform ${activeTab === s.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
          
          <div className="pt-8 mt-8 border-t border-slate-100">
             <a href="mailto:support@Chatevo.app" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-slate-400 hover:text-primary transition-colors">
                <HelpCircle size={16} />
                Need Human Help?
             </a>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
             <div className="p-8 md:p-12 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center">
                     {activeSection && <activeSection.icon size={32} />}
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-slate-900 italic font-serif">{activeSection?.title}</h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Official Guide · Version 2.0</p>
                   </div>
                </div>
                <button className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-primary transition-colors">
                  <ExternalLink size={14} /> View External Docs
                </button>
             </div>

             <div className="p-8 md:p-12 prose prose-slate max-w-none">
                {activeSection?.content}
             </div>

             <div className="mt-auto p-8 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   Verified Production Guide
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic">Last updated: March 2026</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}


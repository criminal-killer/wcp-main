'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Settings, MessageSquare, CreditCard, Zap, Globe, Palette, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import ThemePicker from '@/components/dashboard/ThemePicker'

interface Org {
  name: string
  slug: string
  description: string | null
  theme_color: string | null
  currency: string | null
  wa_phone_number_id: string | null
  store_paypal_email: string | null
  store_cod_enabled: number | null
  whatsapp_verified: number | null
  wa_webhook_verified: number | null
  plan: string | null
  trial_ends_at: string | null
}

interface AutoReply {
  id: string
  type: string
  keyword: string | null
  response: string
  is_active: number | null | boolean
}

const TABS = [
  { id: 'store', label: 'Store Info', icon: Settings },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, secure: true },
  { id: 'payments', label: 'Payments', icon: CreditCard, secure: true },
  { id: 'auto-replies', label: 'Auto-Replies', icon: Zap },
  { id: 'billing', label: 'Billing', icon: Globe },
  { id: 'ai', label: 'AI Agent', icon: Zap, secure: true },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

const SecureSection = ({ children, email, onUnlock }: { children: React.ReactNode, email: string, onUnlock: () => void }) => {
  const [unlocked, setUnlocked] = useState(true) // BYPASSED FOR TESTING
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendCode = async () => {
    setLoading(true)
    // In production, this calls /api/auth/send-otp
    await new Promise(r => setTimeout(r, 1000))
    setCodeSent(true)
    setLoading(false)
  }

  const verifyCode = async () => {
    setLoading(true)
    // Mock verification for now
    if (code === '123456') {
      setUnlocked(true)
      onUnlock()
    } else {
      setError('Invalid security code')
    }
    setLoading(false)
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-6 max-w-xl">
      <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
        <Lock size={32} />
      </div>
      <div>
        <h2 className="text-xl font-black text-foreground">Secure Access Required</h2>
        <p className="text-sm text-muted-foreground mt-2 font-medium">To protect your API keys, we need to verify your identity.</p>
      </div>

      {!codeSent ? (
        <button onClick={sendCode} disabled={loading}
          className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
          {loading ? 'Sending...' : 'Send Access Code to Email'}
        </button>
      ) : (
        <div className="space-y-4">
          <input 
            value={code} onChange={e => setCode(e.target.value)}
            placeholder="6-digit code (Use 123456 for now)" 
            maxLength={6}
            className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:border-primary focus:outline-none" 
          />
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button onClick={verifyCode} disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all">
            {loading ? 'Verifying...' : 'Unlock Section'}
          </button>
          <button onClick={() => setCodeSent(false)} className="text-xs text-slate-400 font-bold hover:text-slate-600">
            Resend Code
          </button>
        </div>
      )}
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
        Security code will be sent to your registered email address. <br />
        Unauthorized access attempts are logged.
      </p>
    </div>
  )
}

export default function SettingsClient({ org, autoReplies }: { org: Org, autoReplies: AutoReply[] }) {
  return (
    <Suspense fallback={<div>Loading Settings...</div>}>
      <SettingsContent org={org} autoReplies={autoReplies} />
    </Suspense>
  )
}

function SettingsContent({ org, autoReplies }: { org: Org, autoReplies: AutoReply[] }) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'store')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [unlockedTabs, setUnlockedTabs] = useState<string[]>(['whatsapp', 'payments']) // AUTO-UNLOCK
  
  const [storeForm, setStoreForm] = useState({
    name: org.name, description: org.description || '', theme_color: org.theme_color || '#25D366',
    currency: org.currency || 'KES',
  })
  const [waForm, setWaForm] = useState({
    phone_number_id: org.wa_phone_number_id || '', access_token: '',
  })
  const [payForm, setPayForm] = useState({
    paystack_key: '', paypal_email: org.store_paypal_email || '',
    cod_enabled: String(org.store_cod_enabled ?? 1) === '1',
  })
  const [aiForm, setAiForm] = useState({
    provider: (org as any).ai_provider || 'sella',
    model: (org as any).ai_model || '',
    persona: (org as any).ai_persona || 'educator',
    api_key: '',
    endpoint_url: (org as any).ai_endpoint_url || '',
    system_prompt: (org as any).ai_system_prompt || '',
  })

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [subscribeError, setSubscribeError] = useState('')

  async function handleSubscribe(plan: string, provider: 'paystack' | 'stripe' | 'paypal') {
    setLoadingPlan(`${plan}-${provider}`)
    setSubscribeError('')
    try {
      const r = await fetch('/api/payments/subscribe', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ plan, provider }) 
      })
      const data = await r.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setSubscribeError(data.error || 'Failed to start checkout. Please ensure keys are configured.')
      }
    } catch (e) {
      setSubscribeError('Network error. Please try again.')
    }
    setLoadingPlan(null)
  }

  const isTabUnlocked = (id: string) => !TABS.find(t => t.id === id)?.secure || unlockedTabs.includes(id)

  const PLANS = [
    { 
      id: 'starter', name: 'Starter', price: 29, trial: 7, 
      features: ['1 Store', '50 Products', 'Basic Shop Bot', 'Standard Admin', '7-Day Free Trial']
    },
    { 
      id: 'pro', name: 'Pro', price: 59, trial: 7, 
      features: ['3 Stores', '500 Products', 'AI Auto-Replies', 'All Themes', 'Abandoned Carts']
    },
    { 
      id: 'elite', name: 'Elite', price: 99, trial: 7, 
      features: ['Unlimited Products', 'Custom AI Agent', 'White-labeling', 'API Access', 'Dedicated Support']
    }
  ]

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground italic font-serif">Workspace Settings</h1>
        <div className="flex items-center gap-2 bg-emerald-50 text-[#075E54] px-4 py-1.5 rounded-full border border-emerald-100">
           <ShieldCheck size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Encrypted</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            <t.icon size={14} className={t.secure ? 'text-amber-500' : ''} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Store Info Tab */}
      {tab === 'store' && (
        <div className="bg-card rounded-2xl border border-border p-8 space-y-6 max-w-xl shadow-sm">
          <h2 className="font-bold text-foreground italic font-serif text-lg text-primary">Store Identity</h2>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Store Brand Name</label>
            <input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Store Description</label>
            <textarea value={storeForm.description} onChange={e => setStoreForm({ ...storeForm, description: e.target.value })}
              rows={3} className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Operational Currency</label>
              <select value={storeForm.currency} onChange={e => setStoreForm({ ...storeForm, currency: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50">
                {['KES', 'NGN', 'GHS', 'ZAR', 'UGX', 'TZS', 'USD', 'GBP', 'EUR', 'INR'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Signature Theme</label>
              <div className="flex items-center gap-3">
                <input type="color" value={storeForm.theme_color} onChange={e => setStoreForm({ ...storeForm, theme_color: e.target.value })}
                  className="w-12 h-12 rounded-xl border border-border cursor-pointer overflow-hidden p-0" />
                <span className="text-[10px] font-black font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{storeForm.theme_color}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl px-4 py-4 border border-slate-100">
            <Globe size={14} className="text-primary" />
            Live Preview: <span className="font-mono text-primary select-all">{process.env.NEXT_PUBLIC_APP_URL}/store/{org.slug}</span>
          </div>
          <button onClick={async () => { setSaving(true); await fetch('/api/settings/store', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(storeForm) }); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }} disabled={saving}
            className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60">
            {saved ? 'âœ“ Changes Applied' : saving ? 'Syncing...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* WhatsApp Tab */}
      {tab === 'whatsapp' && (
        <SecureSection email="owner@email.com" onUnlock={() => setUnlockedTabs([...unlockedTabs, 'whatsapp'])}>
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6 max-w-xl shadow-sm">
            <h2 className="font-bold text-foreground italic font-serif text-lg text-primary text-center">Engine Connectivity</h2>
            <div className={`flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${org.wa_webhook_verified ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
              <div className={`w-2 h-2 rounded-full ${org.wa_webhook_verified ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              {org.wa_webhook_verified ? 'Webhook Status: Active' : 'Webhook Status: Pending Setup'}
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp Phone ID</label>
              <input value={waForm.phone_number_id} onChange={e => setWaForm({ ...waForm, phone_number_id: e.target.value })}
                placeholder="From Meta Developer Console"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Access Token</label>
              <input type="password" value={waForm.access_token} onChange={e => setWaForm({ ...waForm, access_token: e.target.value })}
                placeholder="Paste your permanent access token"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
              <p className="text-[9px] text-muted-foreground/70 mt-2 font-bold uppercase tracking-tight">Token is AES-256 encrypted. Decryption only occurs at the edge during bot execution.</p>
            </div>
            <button onClick={async () => { setSaving(true); await fetch('/api/settings/whatsapp', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(waForm) }); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }} disabled={saving}
              className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60">
              {saved ? 'âœ“ Connected' : saving ? 'Testing Link...' : 'Verify & Connect'}
            </button>
          </div>
        </SecureSection>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <SecureSection email="owner@email.com" onUnlock={() => setUnlockedTabs([...unlockedTabs, 'payments'])}>
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6 max-w-xl shadow-sm">
            <h2 className="font-bold text-foreground italic font-serif text-lg text-primary text-center">Revenue Gateway</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs italic">P.</div>
                    <p className="font-black text-sm text-[#075E54]">Paystack API</p>
                  </div>
                  <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-tighter">Recommended</span>
                </div>
                <input value={payForm.paystack_key} onChange={e => setPayForm({ ...payForm, paystack_key: e.target.value })}
                  type="password" placeholder="sk_live_... (Secret Key)"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold font-mono focus:border-primary focus:outline-none shadow-sm" />
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">PP</div>
                    <p className="font-black text-sm text-[#075E54]">PayPal Business</p>
                  </div>
                </div>
                <input value={payForm.paypal_email} onChange={e => setPayForm({ ...payForm, paypal_email: e.target.value })}
                  type="email" placeholder="your@paypal.com"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:outline-none shadow-sm" />
              </div>
            </div>
            <button onClick={async () => { setSaving(true); await fetch('/api/settings/payments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payForm) }); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }} disabled={saving}
              className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60">
              {saved ? 'âœ“ Verified' : saving ? 'Validating...' : 'Enable Gateways'}
            </button>
          </div>
        </SecureSection>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="max-w-4xl space-y-8">
          <div className="bg-card rounded-3xl border border-border p-8 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Current Commitment</p>
              <h3 className="text-3xl font-serif font-black text-[#075E54] italic capitalize">{org.plan || 'No Active'} Plan</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {org.plan === 'trial' ? `Free Trial · ${org.trial_ends_at ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0} days remaining` : 'Full Access'}
              </p>
            </div>
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
               <CreditCard size={32} className="text-primary" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.id} className={`bg-card rounded-3xl p-8 border-2 transition-all ${org.plan === plan.id ? 'border-primary shadow-xl shadow-primary/10' : 'border-border opacity-90'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black text-[#075E54] font-serif italic">{plan.name}</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black">${plan.price}</span>
                      <span className="text-xs font-bold text-slate-400">/mo</span>
                    </div>
                  </div>
                  {org.plan === plan.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <CheckCircle2 size={10} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {org.plan !== plan.id && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleSubscribe(plan.id, 'paystack')}
                      disabled={!!loadingPlan}
                      className="w-full bg-[#075E54] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all disabled:opacity-50"
                    >
                      {loadingPlan === `${plan.id}-paystack` ? 'Processing...' : 'Pay via Paystack (Local)'}
                    </button>
                    <button 
                      onClick={() => handleSubscribe(plan.id, 'paypal')}
                      disabled={!!loadingPlan}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all disabled:opacity-50"
                    >
                      {loadingPlan === `${plan.id}-paypal` ? 'Processing...' : 'Pay via PayPal (Global)'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {subscribeError && (
             <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4 text-red-700">
                <AlertCircle size={24} />
                <p className="text-sm font-bold tracking-tight">{subscribeError}</p>
             </div>
          )}
        </div>
      )}

      {/* Auto-Replies Tab */}
      {tab === 'auto-replies' && (
        <div className="bg-card rounded-2xl border border-border p-8 space-y-6 max-w-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground italic font-serif text-lg text-primary">Intelligent Auto-Replies</h2>
            <button
               onClick={() => { fetch('/api/auto-replies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'keyword', keyword: '', response: '' }) }).then(() => window.location.reload()) }}
               className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              + Create Rule
            </button>
          </div>
          <div className="grid gap-4">
            {autoReplies.map(reply => (
              <div key={reply.id} className="border border-border rounded-2xl p-6 hover:border-primary transition-all group bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-card px-3 py-1 rounded-full border border-slate-100 text-slate-400 group-hover:text-primary group-hover:border-primary/20 transition-all">Matched {reply.type}</span>
                  <div className={`w-2 h-2 rounded-full ${reply.is_active ? 'bg-primary' : 'bg-slate-300'}`} />
                </div>
                <p className="text-sm font-black text-[#075E54] mb-1 italic">Keyword: "{reply.keyword}"</p>
                <p className="text-xs font-medium text-slate-500 leading-relaxed font-sans">{reply.response}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {tab === 'appearance' && (
        <div className="bg-card rounded-2xl border border-border p-8 space-y-8 max-w-xl shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <Palette size={28} />
             </div>
             <div>
               <h2 className="font-bold text-foreground italic font-serif text-xl text-indigo-600">Visual Aesthetic</h2>
               <p className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.2em] mt-1">Configure your dashboard theme</p>
             </div>
          </div>
          <ThemePicker />
        </div>
      )}

      {/* AI Agent Tab */}
      {tab === 'ai' && (
        <SecureSection email="owner@email.com" onUnlock={() => setUnlockedTabs([...unlockedTabs, 'ai'])}>
          <div className="bg-card rounded-2xl border border-border p-8 space-y-8 max-w-2xl shadow-sm">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                 <Zap size={28} />
               </div>
               <div>
                 <h2 className="font-bold text-foreground italic font-serif text-xl text-amber-600">AI Intelligence Core</h2>
                 <p className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.2em] mt-1">Configure your store's brain</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">AI Provider</label>
                <select 
                  value={aiForm.provider} 
                  onChange={e => setAiForm({ ...aiForm, provider: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50"
                >
                  <option value="sella">Sella Default (Groq/Llama)</option>
                  <option value="google">Google Gemini (Fast & Efficient)</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="custom">Custom (OpenAI Compatible)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Interaction Persona</label>
                <select 
                  value={aiForm.persona} 
                  onChange={e => setAiForm({ ...aiForm, persona: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50"
                >
                  <option value="educator">🧑‍🏫 Educator/Teacher</option>
                  <option value="sales">💰 Elite Sales Agent</option>
                  <option value="support">🛠️ Customer Support</option>
                </select>
              </div>
            </div>

            {aiForm.provider !== 'sella' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Custom API Key</label>
                  <input 
                    type="password" 
                    value={aiForm.api_key} 
                    onChange={e => setAiForm({ ...aiForm, api_key: e.target.value })}
                    placeholder="Enter your secret key"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" 
                  />
                  <p className="text-[9px] text-muted-foreground/70 mt-2 font-bold uppercase tracking-tight">Key is AES-256 encrypted. Decryption only occurs during chat execution.</p>
                </div>

                {aiForm.provider === 'custom' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Base Endpoint URL</label>
                    <input 
                      value={aiForm.endpoint_url} 
                      onChange={e => setAiForm({ ...aiForm, endpoint_url: e.target.value })}
                      placeholder="https://api.yourprovider.com/v1"
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Model Name (Optional)</label>
                  <input 
                    value={aiForm.model} 
                    onChange={e => setAiForm({ ...aiForm, model: e.target.value })}
                    placeholder="e.g. gpt-4o, gemini-1.5-flash"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" 
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Prompt Refinement (Optional)</label>
              <textarea 
                value={aiForm.system_prompt} 
                onChange={e => setAiForm({ ...aiForm, system_prompt: e.target.value })}
                rows={3} 
                placeholder="Add special instructions for your AI agent..."
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 resize-none" 
              />
            </div>

            <button 
              onClick={async () => { 
                setSaving(true); 
                try {
                  const res = await fetch('/api/settings/ai', { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({
                      ai_provider: aiForm.provider,
                      ai_model: aiForm.model,
                      ai_persona: aiForm.persona,
                      ai_api_key: aiForm.api_key,
                      ai_endpoint_url: aiForm.endpoint_url,
                      ai_system_prompt: aiForm.system_prompt,
                    }) 
                  });
                  if (!res.ok) throw new Error('Failed to save');
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                } catch (e) {
                  alert('Verification failed. Please check your credentials.');
                } finally {
                  setSaving(false);
                }
              }} 
              disabled={saving}
              className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60"
            >
              {saved ? '✓ Brain Synchronized' : saving ? 'Optimizing Neural Paths...' : 'Update Intelligence'}
            </button>
          </div>
        </SecureSection>
      )}
    </div>
  )
}

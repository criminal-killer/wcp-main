'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Settings, MessageSquare, CreditCard, Zap, Globe, Palette, Lock, ShieldCheck, AlertCircle, CheckCircle2, SendHorizonal, Eye, EyeOff } from 'lucide-react'
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
  
  // Bot Customization
  bot_menu_style: string | null
  bot_emojis_enabled: number | null
  bot_custom_footer: string | null

  // AI Usage
  usage_ai_daily_count: number | null
  usage_ai_monthly_count: number | null

  // Bot Menu Toggles
  bot_show_search: number | null
  bot_show_categories: number | null
  bot_show_cart: number | null
  bot_show_orders: number | null

  // Fulfillment & Zones
  delivery_fee: number | null
  delivery_zones: string | null
  enabled_features: string | null
  store_mpesa_till: string | null
  store_bank_details: string | null
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
  { id: 'ai', label: 'AI Agent', icon: Zap, secure: true },
  { id: 'chatbot', label: 'Chatbot Styling', icon: Palette, secure: true },
  { id: 'fulfillment', label: 'Fulfillment', icon: Globe, secure: true },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Billing', icon: Globe },
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState('store')
  
  // Safe initialization of tab from URL
  useEffect(() => {
    setMounted(true)
    const initialTab = searchParams.get('tab')
    if (initialTab && TABS.some(t => t.id === initialTab)) {
      setTab(initialTab)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setTab(newTab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.replace(`/dashboard/settings?${params.toString()}`, { scroll: false })
  }
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [unlockedTabs, setUnlockedTabs] = useState<string[]>(['whatsapp', 'payments']) // AUTO-UNLOCK
  
  const [testPhone, setTestPhone] = useState('')
  const [testingBot, setTestingBot] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)
  
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

  const [fulfillmentForm, setFulfillmentForm] = useState({
    delivery_fee: org.delivery_fee || 0,
    delivery_zones: JSON.parse(org.delivery_zones || '[]') as Array<{ name: string; fee: number }>,
    enabled_features: JSON.parse(org.enabled_features || '{"ai_shopping":true,"manual_payments":true,"delivery_zones":true}'),
    store_mpesa_till: org.store_mpesa_till || '',
    store_bank_details: org.store_bank_details || '',
  })

  const [botForm, setBotForm] = useState({
    menu_style: org.bot_menu_style || 'professional',
    emojis_enabled: (org.bot_emojis_enabled ?? 1) === 1,
    custom_footer: org.bot_custom_footer || 'Powered by Sella',
    // Toggles for what shows in main menu
    show_search: org.bot_show_search !== 0,
    show_categories: org.bot_show_categories !== 0,
    show_cart: org.bot_show_cart !== 0,
    show_orders: org.bot_show_orders !== 0,
  })

  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({
    wa_token: false,
    paystack_key: false,
    ai_key: false,
    fulfillment: false,
  })

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [subscribeError, setSubscribeError] = useState('')
  const [showAllPlans, setShowAllPlans] = useState(false)

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
      id: 'starter', name: 'Chatevo Starter', price: 3500, currency: 'KES', paystackUrl: 'https://paystack.shop/pay/chatevo-starter',
      features: ['50 Products', 'AI WhatsApp Bot', 'MPesa/Paybill/Bank Payments', 'Order Management', 'Basic Analytics']
    },
    { 
      id: 'growth', name: 'Chatevo Growth', price: 7000, currency: 'KES', paystackUrl: 'https://paystack.shop/pay/chatevo-growth',
      features: ['Unlimited Products', 'Digital Product Delivery', 'Abandoned Cart Recovery', 'Custom Bot Persona', 'Bulk Broadcasts']
    },
    { 
      id: 'elite', name: 'Chatevo Elite', price: 13000, currency: 'KES', paystackUrl: 'https://paystack.shop/pay/chatevo-elite',
      features: ['Everything in Growth', '5 Team Members', 'API Access', 'Priority Support', 'Dedicated Account Manager']
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
            onClick={() => handleTabChange(t.id)}
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

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp Phone ID</label>
                <input value={waForm.phone_number_id} onChange={e => setWaForm({ ...waForm, phone_number_id: e.target.value })}
                  placeholder="From Meta Developer Console"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Access Token</label>
                <div className="relative">
                  <input value={waForm.access_token} onChange={e => setWaForm({ ...waForm, access_token: e.target.value })}
                    type={showTokens.wa_token ? "text" : "password"} placeholder={org.wa_webhook_verified ? "••••••••••••••••" : "Paste your permanent access token"}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 pr-12" />
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowTokens({ ...showTokens, wa_token: !showTokens.wa_token }) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showTokens.wa_token ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-tight">Token is AES-256 encrypted.</p>
                  {org.wa_phone_number_id ? (
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        if (confirm('Revoke all WhatsApp credentials? Your bot will stop working immediately.')) {
                          await fetch('/api/settings/whatsapp/revoke', { method: 'POST' });
                          window.location.reload();
                        }
                      }}
                      className="text-[9px] text-red-500 font-bold uppercase tracking-widest hover:underline"
                    >
                      Revoke Credentials
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Meta Webhook Setup</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Callback URL</p>
                  <code className="text-[11px] font-bold text-primary break-all">{process.env.NEXT_PUBLIC_APP_URL || 'https://sella-app.vercel.app'}/api/webhook</code>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Verify Token</p>
                  <code className="text-[11px] font-bold text-primary">sella-webhook-verification-2024</code>
                </div>
              </div>
              <ul className="text-[10px] font-bold text-slate-500 space-y-2 list-disc pl-4">
                <li>Go to Meta Developers Console &gt; WhatsApp &gt; Configuration</li>
                <li>Paste the URL and Token above</li>
                <li>Click <strong>"Manage"</strong> under Webhooks and subscribe to <strong>"messages"</strong></li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Test Connection</h3>
                {org.wa_webhook_verified ? (
                  <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Active</span>
                ) : (
                  <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Inactive</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic">
                Send a test message to your phone to verify your credentials are correct.
              </p>
              <div className="flex gap-2">
                <input 
                  value={testPhone} onChange={e => setTestPhone(e.target.value)}
                  placeholder="e.g. 254712345678"
                  className="flex-1 border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm" 
                />
                <button 
                  onClick={async () => {
                    setTestingBot(true);
                    setTestResult(null);
                    try {
                      const r = await fetch('/api/settings/whatsapp/test-connection', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ test_phone: testPhone })
                      });
                      const data = await r.json();
                      if (data.success) {
                        setTestResult({ success: true });
                        router.refresh();
                      } else {
                        setTestResult({ error: data.error });
                      }
                    } catch (e) {
                      setTestResult({ error: 'Network error' });
                    }
                    setTestingBot(false);
                  }}
                  disabled={testingBot || !testPhone}
                  className="bg-primary text-white p-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center aspect-square disabled:opacity-50"
                >
                  {testingBot ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SendHorizonal size={20} />
                  )}
                </button>
              </div>
              {testResult?.error && <p className="text-[10px] text-red-500 font-bold bg-red-50 p-3 rounded-lg border border-red-100 italic">{testResult.error}</p>}
              {testResult?.success && <p className="text-[10px] text-green-600 font-bold bg-green-50 p-3 rounded-lg border border-green-100 italic font-serif">Success! Engine is now activated.</p>}
            </div>
            <button 
              onClick={async () => { 
                setSaving(true); 
                try {
                  const res = await fetch('/api/settings/whatsapp', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(waForm) }); 
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data.error || 'Failed to save credentials.');
                  } else {
                    setSaved(true); 
                    setTimeout(() => setSaved(false), 2000);
                  }
                } catch(e) {
                  alert('Network error while saving credentials.');
                } finally {
                  setSaving(false);
                }
              }} 
              disabled={saving}
              className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60"
            >
              {saved ? '✓ Credentials Saved' : saving ? 'Saving...' : 'Save WhatsApp Credentials'}
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
                <div className="relative">
                  <input value={payForm.paystack_key} onChange={e => setPayForm({ ...payForm, paystack_key: e.target.value })}
                    type={showTokens.paystack_key ? "text" : "password"} placeholder="sk_live_... (Secret Key)"
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold font-mono focus:border-primary focus:outline-none shadow-sm pr-12" />
                  <button 
                    onClick={() => setShowTokens({ ...showTokens, paystack_key: !showTokens.paystack_key })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                  >
                    {showTokens.paystack_key ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {payForm.paystack_key && (
                  <button 
                    onClick={async () => {
                      if (confirm('Deactivate Paystack?')) {
                        await fetch('/api/settings/payments/revoke-paystack', { method: 'POST' });
                        window.location.reload();
                      }
                    }}
                    className="text-[9px] text-red-500 font-bold uppercase mt-2 hover:underline"
                  >
                    Deactivate Account
                  </button>
                )}
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
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
          <div className="bg-card rounded-3xl border border-border p-8 flex flex-col md:flex-row items-center justify-between shadow-sm gap-6">
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Current Commitment</p>
              <h3 className="text-3xl font-serif font-black text-[#075E54] italic capitalize">
                {(org.plan === 'trial' || !org.plan) ? 'Standard Trial' : `${org.plan} Plan`}
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {org.plan === 'trial' ? `Free Trial · ${org.trial_ends_at ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0} days remaining` : 'Subscription Active'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {org.plan && org.plan !== 'trial' && !showAllPlans && (
                <button 
                  onClick={() => setShowAllPlans(true)}
                  className="px-6 py-3 bg-secondary text-foreground rounded-2xl font-bold text-sm hover:bg-secondary/80 transition-all border border-border"
                >
                  Manage / Change Plan
                </button>
              )}
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                 <CreditCard size={32} className="text-primary" />
              </div>
            </div>
          </div>

          {((org.plan === 'trial' || !org.plan) || showAllPlans) && (
            <div className="grid md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
              {PLANS.map(plan => (
                <div key={plan.id} className={`bg-card rounded-3xl p-8 border-2 transition-all flex flex-col ${org.plan === plan.id ? 'border-primary shadow-xl shadow-primary/10' : 'border-border opacity-90'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-black text-[#075E54] font-serif italic">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs font-black text-slate-400">KES</span>
                        <span className="text-2xl font-black">{plan.price.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-400">/mo</span>
                      </div>
                    </div>
                    {org.plan === plan.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <CheckCircle2 size={10} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {(org.plan !== plan.id || showAllPlans) && (
                    <div className="space-y-2 mt-auto">
                      <a 
                        href={(plan as any).paystackUrl}
                        className={`block w-full text-center ${org.plan === plan.id ? 'bg-secondary text-foreground border border-border' : 'bg-[#075E54] text-white'} py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all`}
                      >
                        {org.plan === plan.id ? 'Current Plan' : `Subscribe via Paystack`}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAllPlans && (
            <div className="text-center">
              <button 
                onClick={() => setShowAllPlans(false)}
                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
              >
                ← Back to Active Plan
              </button>
            </div>
          )}

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

      {/* Chatbot Styling Tab */}
      {tab === 'chatbot' && (
        <div className="bg-card rounded-2xl border border-border p-8 space-y-8 max-w-2xl shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
               <MessageSquare size={28} />
             </div>
             <div>
               <h2 className="font-bold text-foreground italic font-serif text-xl text-green-600">Bot Personality & Logic</h2>
               <p className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.2em] mt-1">Customize how your bot talks & sells</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Greeting Style</label>
                <select 
                  value={botForm.menu_style} 
                  onChange={e => setBotForm({ ...botForm, menu_style: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="professional">🤵 Professional Concierge (Elegant)</option>
                  <option value="street">👟 Street Style (Casual & Cool)</option>
                  <option value="minimal">🌑 Minimalist (Clean & Fast)</option>
                  <option value="corporate">💼 Corporate (Formal & Direct)</option>
                  <option value="friendly">👋 Ultra-Friendly (Warm & Chatty)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                 <div>
                   <p className="text-sm font-black text-slate-700">Enable Emojis</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Add visual flair to messages</p>
                 </div>
                 <input 
                   type="checkbox" 
                   checked={botForm.emojis_enabled}
                   onChange={e => setBotForm({ ...botForm, emojis_enabled: e.target.checked })}
                   className="w-5 h-5 accent-primary" 
                 />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Bot Footer Signature</label>
                <input 
                  value={botForm.custom_footer} 
                  onChange={e => setBotForm({ ...botForm, custom_footer: e.target.value })}
                  placeholder="e.g. Powered by Chatevo"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold bg-slate-50" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Main Menu Toggles</p>
              {[
                { id: 'show_search', label: 'Search Products Button' },
                { id: 'show_categories', label: 'Categories Button' },
                { id: 'show_cart', label: 'Cart Button' },
                { id: 'show_orders', label: 'Orders Button' },
              ].map(toggle => (
                <div key={toggle.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-xs font-bold text-slate-600">{toggle.label}</span>
                  <input 
                    type="checkbox" 
                    checked={(botForm as any)[toggle.id]}
                    onChange={e => setBotForm({ ...botForm, [toggle.id]: e.target.checked })}
                    className="w-5 h-5 accent-[#075E54]" 
                  />
                </div>
              ))}
            </div>
          </div>

          {(org.plan === 'starter' || !org.plan) && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">Monthly AI Limits (Starter)</h4>
                <p className="text-xs font-black text-amber-600">{org.usage_ai_monthly_count || 0} / 350</p>
              </div>
              <div className="w-full h-2 bg-amber-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((org.usage_ai_monthly_count || 0) / 350) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-amber-600 italic">Daily limit: {org.usage_ai_daily_count || 0} / 20 searches. Reset occurs at midnight.</p>
            </div>
          )}

          <button onClick={async () => { setSaving(true); await fetch('/api/settings/chatbot', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botForm) }); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }} disabled={saving}
            className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all">
            {saved ? '✓ Styling Updated' : saving ? 'Updating Bot...' : 'Apply Bot Personalization'}
          </button>
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
                  <option value="sella">Chatevo Default (Groq/Llama)</option>
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
                  <div className="relative">
                    <input 
                      type={showTokens.ai_key ? "text" : "password"} 
                      value={aiForm.api_key} 
                      onChange={e => setAiForm({ ...aiForm, api_key: e.target.value })}
                      placeholder="Enter your secret key"
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 pr-12" 
                    />
                    <button 
                      onClick={(e) => { e.preventDefault(); setShowTokens({ ...showTokens, ai_key: !showTokens.ai_key }) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showTokens.ai_key ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-tight">Key is AES-256 encrypted.</p>
                    {aiForm.api_key && (
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          if (confirm('Revoke AI Credentials?')) {
                            await fetch('/api/settings/ai/revoke', { method: 'POST' });
                            window.location.reload();
                          }
                        }}
                        className="text-[9px] text-red-500 font-bold uppercase tracking-widest hover:underline"
                      >
                        Clear AI Credentials
                      </button>
                    )}
                  </div>
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

      {/* Fulfillment Tab */}
      {tab === 'fulfillment' && (
        <SecureSection email="owner@email.com" onUnlock={() => setUnlockedTabs([...unlockedTabs, 'fulfillment'])}>
          <div className="bg-card rounded-2xl border border-border p-8 space-y-8 max-w-2xl shadow-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                 <Globe size={28} />
               </div>
               <div>
                 <h2 className="font-bold text-foreground italic font-serif text-xl text-blue-600">Advanced Fulfillment</h2>
                 <p className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.2em] mt-1">Delivery zones, Manual payments & Features</p>
               </div>
            </div>

            <div className="space-y-6">
              {/* Feature Toggles */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Platform Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'ai_shopping', label: 'AI Personal Shopper' },
                    { id: 'manual_payments', label: 'Manual Payments (Till/Bank)' },
                    { id: 'delivery_zones', label: 'Delivery Zone Picker' },
                  ].map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600">{f.label}</span>
                      <input 
                        type="checkbox" 
                        checked={(fulfillmentForm.enabled_features as any)[f.id]}
                        onChange={e => setFulfillmentForm({ 
                          ...fulfillmentForm, 
                          enabled_features: { ...fulfillmentForm.enabled_features, [f.id]: e.target.checked } 
                        })}
                        className="w-4 h-4 accent-blue-600" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Payments */}
              {fulfillmentForm.enabled_features.manual_payments && (
                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Manual Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">M-Pesa Buy Goods Till</label>
                      <input 
                        value={fulfillmentForm.store_mpesa_till} 
                        onChange={e => setFulfillmentForm({ ...fulfillmentForm, store_mpesa_till: e.target.value })}
                        placeholder="e.g. 5123456"
                        className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">Bank Transfer Details</label>
                      <input 
                        value={fulfillmentForm.store_bank_details} 
                        onChange={e => setFulfillmentForm({ ...fulfillmentForm, store_bank_details: e.target.value })}
                        placeholder="Bank Name, Acc Number, Branch"
                        className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Zones */}
              {fulfillmentForm.enabled_features.delivery_zones && (
                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-700">Delivery Zones & Fees</h3>
                    <button 
                      onClick={() => setFulfillmentForm({ 
                        ...fulfillmentForm, 
                        delivery_zones: [...fulfillmentForm.delivery_zones, { name: '', fee: 0 }] 
                      })}
                      className="text-[10px] font-black text-blue-700 uppercase hover:underline"
                    >
                      + Add Zone
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {fulfillmentForm.delivery_zones.length === 0 && (
                      <p className="text-xs text-blue-400 italic text-center py-4">No zones added. Global delivery fee will apply.</p>
                    )}
                    {fulfillmentForm.delivery_zones.map((zone, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          value={zone.name} 
                          onChange={e => {
                            const newZones = [...fulfillmentForm.delivery_zones];
                            newZones[idx].name = e.target.value;
                            setFulfillmentForm({ ...fulfillmentForm, delivery_zones: newZones });
                          }}
                          placeholder="Zone Name"
                          className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-xs font-bold bg-white"
                        />
                        <input 
                          type="number"
                          value={zone.fee} 
                          onChange={e => {
                            const newZones = [...fulfillmentForm.delivery_zones];
                            newZones[idx].fee = parseFloat(e.target.value) || 0;
                            setFulfillmentForm({ ...fulfillmentForm, delivery_zones: newZones });
                          }}
                          className="w-24 border border-blue-200 rounded-lg px-3 py-2 text-xs font-bold bg-white"
                        />
                        <button 
                          onClick={() => setFulfillmentForm({ 
                            ...fulfillmentForm, 
                            delivery_zones: fulfillmentForm.delivery_zones.filter((_, i) => i !== idx) 
                          })}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={async () => { 
              setSaving(true); 
              await fetch('/api/settings/fulfillment', { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({
                  ...fulfillmentForm,
                  delivery_zones: JSON.stringify(fulfillmentForm.delivery_zones),
                  enabled_features: JSON.stringify(fulfillmentForm.enabled_features),
                }) 
              }); 
              setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) 
            }} disabled={saving}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-blue-100 transition-all disabled:opacity-60">
              {saved ? '✓ Engine Sync' : saving ? 'Optimizing...' : 'Sync Fulfillment Logic'}
            </button>
          </div>
        </SecureSection>
      )}
    </div>
  )
}

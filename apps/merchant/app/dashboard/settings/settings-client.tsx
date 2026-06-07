'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Settings, MessageSquare, CreditCard, Zap, Globe, Palette, Lock, ShieldCheck, AlertCircle, CheckCircle2, SendHorizonal, Loader2, User, LogOut, ArrowLeft } from 'lucide-react'
import ThemePicker from '@/components/dashboard/ThemePicker'

interface Org {
  name: string
  slug: string
  description: string | null
  theme_color: string | null
  currency: string | null
  wa_phone_number_id: string | null
  wa_bot_number: string | null
  wa_business_account_id: string | null
  wa_webhook_verified: number | null
  notification_preference: string | null
  notification_phone: string | null
  store_paypal_email: string | null
  store_cod_enabled: number | null
  whatsapp_verified: number | null
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
  { id: 'account', label: 'Account', icon: User },
  { id: 'store', label: 'Store Info', icon: Settings },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, secure: true },
  { id: 'payments', label: 'Payments', icon: CreditCard, secure: true },
  { id: 'auto-replies', label: 'Auto-Replies', icon: Zap },
  { id: 'billing', label: 'Billing', icon: Globe },
  { id: 'ai', label: 'AI Agent', icon: Zap, secure: true },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

const SecureSection = ({ children, email, onUnlock }: { children: React.ReactNode, email: string, onUnlock: () => void }) => {
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true) // checking cookie status on mount
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // On mount, ask the server if the unlock cookie is still valid
  useEffect(() => {
    fetch('/api/auth/otp-status')
      .then(r => r.json())
      .then(data => {
        if (data.unlocked) {
          setUnlocked(true)
          onUnlock()
        }
      })
      .catch(() => { /* ignore — will just show locked state */ })
      .finally(() => setChecking(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendCode = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setCodeSent(true)
      } else {
        setError(data.error || 'Failed to send code. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUnlocked(true)
        onUnlock()
      } else {
        setError(data.error || 'Invalid or expired code. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  if (checking) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
    </div>
  )
}

  if (unlocked) return <>{children}</>

  return (
    <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-6 max-w-xl">
      <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
        <Lock size={32} />
      </div>
      <div>
        <h2 className="text-xl font-black text-foreground">Secure Access Required</h2>
        <p className="text-sm text-muted-foreground mt-2 font-medium">
          To protect your sensitive settings (WhatsApp, Payments, AI), verify your identity.
        </p>
        {email && (
          <p className="text-xs text-muted-foreground/70 mt-3 font-bold">
            We&#39;ll send a code to: <span className="text-primary font-mono">{email}</span>
          </p>
        )}
      </div>

      {!codeSent ? (
        <>
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button onClick={sendCode} disabled={loading}
            className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Access Code to Email'}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <input 
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code" 
            maxLength={6}
            autoFocus
            className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:border-primary focus:outline-none" 
          />
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button onClick={verifyCode} disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Unlock Section'}
          </button>
          <button onClick={() => { setCodeSent(false); setError(''); setCode('') }} className="text-xs text-slate-400 font-bold hover:text-slate-600">
            Resend Code
          </button>
        </div>
      )}
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
        Unlock lasts 20 minutes. Unauthorized access attempts are logged.
      </p>
    </div>
  )
}

const ALL_PAYMENT_METHODS = [
  {
    type: 'paypal', label: 'PayPal', icon: 'P', regions: 'Global — US, UK, Europe, Asia',
    fields: [{ key: 'email', label: 'PayPal Email', type: 'email' as const, placeholder: 'you@example.com' }],
  },
  {
    type: 'stripe', label: 'Credit/Debit Card (Stripe)', icon: '💳', regions: 'Global — US, UK, Europe, Australia',
    fields: [
      { key: 'publishable_key', label: 'Stripe Publishable Key', type: 'text' as const, placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Stripe Secret Key', type: 'password' as const, placeholder: 'sk_live_...' },
    ],
  },
  {
    type: 'paystack', label: 'Paystack', icon: '₦', regions: 'Africa — Nigeria, Ghana, South Africa, Kenya',
    fields: [{ key: 'secret_key', label: 'Paystack Secret Key', type: 'password' as const, placeholder: 'sk_live_...' }],
  },
  {
    type: 'mpesa', label: 'M-Pesa', icon: 'MP', regions: 'East Africa — Kenya, Tanzania, Uganda',
    fields: [{ key: 'till', label: 'Till / Paybill Number', type: 'text' as const, placeholder: 'e.g. 123456' }],
  },
  {
    type: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', regions: 'Global',
    fields: [{ key: 'details', label: 'Bank Details (account name, number, bank, routing)', type: 'text' as const, placeholder: 'e.g. Acme Corp, 1234567890, Chase Bank' }],
  },
  {
    type: 'cashapp', label: 'Cash App', icon: '$', regions: 'US, UK',
    fields: [{ key: 'cashtag', label: '$Cashtag', type: 'text' as const, placeholder: '$yourcashtag' }],
  },
  {
    type: 'venmo', label: 'Venmo', icon: 'V', regions: 'US',
    fields: [{ key: 'username', label: 'Venmo Username', type: 'text' as const, placeholder: '@username' }],
  },
  {
    type: 'upi', label: 'UPI (Google Pay / PhonePe / Paytm)', icon: 'UP', regions: 'India',
    fields: [{ key: 'upi_id', label: 'UPI ID', type: 'text' as const, placeholder: 'merchant@upi' }],
  },
  {
    type: 'gcash', label: 'GCash', icon: 'GC', regions: 'Philippines',
    fields: [{ key: 'number', label: 'GCash Number', type: 'tel' as const, placeholder: '+63 9XX XXX XXXX' }],
  },
  {
    type: 'pix', label: 'Pix', icon: 'P', regions: 'Brazil',
    fields: [{ key: 'pix_key', label: 'Pix Key (CPF/CNPJ/Email/Phone)', type: 'text' as const, placeholder: 'your@email.com' }],
  },
  {
    type: 'cod', label: 'Cash on Delivery', icon: '📦', regions: 'Global',
    fields: [],
  },
]

export default function SettingsClient({ org, autoReplies, waVerifyToken }: { org: Org, autoReplies: AutoReply[], waVerifyToken?: string }) {
  return (
    <Suspense fallback={<div>Loading Settings...</div>}>
      <SettingsContent org={org} autoReplies={autoReplies} waVerifyToken={waVerifyToken} />
    </Suspense>
  )
}

function SettingsContent({ org, autoReplies, waVerifyToken }: { org: Org, autoReplies: AutoReply[], waVerifyToken?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? ''
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState('store')
  
  // Safe initialization of tab from URL
  useEffect(() => {
    setMounted(true)
    const initialTab = searchParams.get('tab')
    if (initialTab && TABS.some(t => t.id === initialTab)) {
      setTab(initialTab)
    } else if (searchParams.get('plan')) {
      setTab('billing') // auto open billing if plan is in URL
    }
    
    if (searchParams.get('plan')) {
      setShowAllPlans(true)
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
  const [unlockedTabs, setUnlockedTabs] = useState<string[]>([])
  
  const [testPhone, setTestPhone] = useState('')
  const [testingBot, setTestingBot] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)
  
  const [storeForm, setStoreForm] = useState({
    name: org.name, description: org.description || '', theme_color: org.theme_color || '#25D366',
    currency: org.currency || 'KES',
  })
  const [waForm, setWaForm] = useState({
    phone_number_id: org.wa_phone_number_id || '',
    wa_bot_number: org.wa_bot_number || '',
    access_token: '',
    wa_business_account_id: org.wa_business_account_id || '',
    notification_preference: org.notification_preference || 'dashboard',
    notification_phone: org.notification_phone || '',
  })
  const [aiForm, setAiForm] = useState({
    provider: (org as any).ai_provider || 'Chatevo',
    model: (org as any).ai_model || '',
    persona: (org as any).ai_persona || 'educator',
    api_key: '',
    endpoint_url: (org as any).ai_endpoint_url || '',
    system_prompt: (org as any).ai_system_prompt || '',
  })

  const existingPaymentMethods: Array<{ type: string; label: string; details: Record<string, string> }> = (org as any).payment_methods
    ? (() => { try { return JSON.parse((org as any).payment_methods); } catch { return []; } })()
    : []

  const [enabledMethods, setEnabledMethods] = useState<string[]>(
    existingPaymentMethods.length > 0
      ? existingPaymentMethods.map((pm: any) => pm.type)
      : (org.store_cod_enabled ? ['cod'] : [])
  )
  const [methodDetails, setMethodDetails] = useState<Record<string, Record<string, string>>>(
    existingPaymentMethods.length > 0
      ? existingPaymentMethods.reduce((acc: any, pm: any) => ({ ...acc, [pm.type]: pm.details || {} }), {})
      : {}
  )
  const [customMethods, setCustomMethods] = useState<Array<{ type: string; label: string }>>(
    existingPaymentMethods.length > 0
      ? existingPaymentMethods
          .filter((pm: any) => pm.type.startsWith('custom_'))
          .map((pm: any) => ({ type: pm.type, label: pm.label }))
      : []
  )

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [subscribeError, setSubscribeError] = useState('')
  const [showAllPlans, setShowAllPlans] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

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
      features: ['100 Products', 'Chatevo AI Default', 'Standard Admin', 'WhatsApp Storefront', '7-Day Free Trial']
    },
    { 
      id: 'pro', name: 'Pro', price: 59, trial: 7, 
      features: ['500 Products', 'Custom AI Agent (Gemini/GPT)', 'Advanced Analytics', 'Bulk Product Upload', 'Abandoned Cart Recovery']
    },
    { 
      id: 'growth', name: 'Growth', price: 99, trial: 7, 
      features: ['5,000 Products', 'White-label Storefront', 'Dedicated Account Manager', 'Custom API Integrations', 'Priority AI Processing']
    }
  ]

  const activePlan = org.plan || 'trial'
  const isOnTrial = activePlan === 'trial'
  const chosenPlan = PLANS.find(p => p.id === activePlan)
  const hasSubscribed = !isOnTrial && org.trial_ends_at && new Date(org.trial_ends_at).getTime() < Date.now()
  const trialDaysLeft = org.trial_ends_at ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-black text-foreground italic font-serif">Workspace Settings</h1>
        </div>
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

      {/* Account Tab */}
      {tab === 'account' && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-8 max-w-xl shadow-sm">
            <h2 className="font-bold text-foreground italic font-serif text-lg text-primary mb-6">Profile Settings</h2>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User size={40} className="text-primary" />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">{user?.fullName || 'Your Name'}</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Display Name</label>
                <input 
                  value={user?.fullName || ''} 
                  disabled
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 text-muted-foreground"
                />
                <p className="text-xs text-slate-400 mt-1">Update your name in your Clerk profile</p>
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                <input 
                  value={userEmail} 
                  disabled
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold bg-slate-50 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-red-200/50 p-8 max-w-xl shadow-sm">
            <h2 className="font-bold text-red-600 italic font-serif text-lg mb-4">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">Once you log out, you'll need to sign in again to access your dashboard.</p>
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to log out?')) {
                  router.push('/')
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </div>
      )}

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
        <SecureSection email={userEmail} onUnlock={() => setUnlockedTabs([...unlockedTabs, 'whatsapp'])}>
          <div className="space-y-6 max-w-xl">

            {/* Setup Progress Bar */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="font-bold text-foreground italic font-serif text-lg text-primary mb-4">   Setup Progress</h2>
              <div className="space-y-3">
                {[
                  { label: 'Phone Number ID', done: !!org.wa_phone_number_id, help: 'Required to send/receive WhatsApp messages' },
                  { label: 'System Access Token', done: !!org.wa_phone_number_id, help: 'Required to authenticate with Meta API' },
                  { label: 'WhatsApp Bot Number', done: !!org.wa_bot_number, help: 'The number customers see & message' },
                  { label: 'Webhook Verified', done: !!org.wa_webhook_verified, help: 'Confirms Meta can reach your bot' },
                  { label: 'Products Added', done: true, help: 'Add products via the Products page' },
                  { label: 'Payment Methods', done: true, help: 'Configure in the Payments tab' },
                  { label: 'Notification Preference', done: true, help: 'Choose how you get notified' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'bg-slate-200'}`}>
                      {item.done ? <CheckCircle2 size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <div>
                      <span className={`text-sm font-bold ${item.done ? 'text-green-700' : 'text-slate-400'}`}>{item.label}</span>
                      <p className="text-[10px] text-slate-400 font-medium">{item.help}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credentials */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-foreground italic font-serif text-lg text-primary">WhatsApp Credentials</h2>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                These are the connection details from Meta. Follow the guide below if you need help finding them.
              </p>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp Phone ID</label>
                <input value={waForm.phone_number_id} onChange={e => setWaForm({ ...waForm, phone_number_id: e.target.value })}
                  placeholder="e.g. 123456789012345"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
                <p className="text-[9px] text-slate-400 font-bold mt-1">The numeric ID of your phone number in Meta's system (not the actual phone number).</p>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Access Token</label>
                <input type="password" value={waForm.access_token} onChange={e => setWaForm({ ...waForm, access_token: e.target.value })}
                  placeholder="Paste your permanent access token"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
                <p className="text-[9px] text-slate-400 font-bold mt-1">A permanent token from Meta Business Settings. AES-256 encrypted at rest.</p>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">WABA ID</label>
                <input value={waForm.wa_business_account_id} onChange={e => setWaForm({ ...waForm, wa_business_account_id: e.target.value })}
                  placeholder="From WhatsApp Manager"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
                <p className="text-[9px] text-slate-400 font-bold mt-1">Your WhatsApp Business Account ID. Optional but helps with debugging.</p>
              </div>
            </div>

            {/* Bot Phone Number */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold">📞</div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Your Bot Number</h3>
                  <p className="text-[10px] text-emerald-600/70 font-medium mt-0.5">The phone number customers will text on WhatsApp</p>
                </div>
              </div>
              {org.wa_bot_number ? (
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-emerald-100 mb-3">
                  <span className="text-lg font-bold text-emerald-700 select-all">{org.wa_bot_number}</span>
                  <button onClick={() => { navigator.clipboard.writeText(org.wa_bot_number || ''); }} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 ml-auto">Copy</button>
                </div>
              ) : (
                <p className="text-xs text-emerald-600/50 font-medium italic mb-3">Not set yet — customers won't have a number to message.</p>
              )}
              <input value={waForm.wa_bot_number} onChange={e => setWaForm({ ...waForm, wa_bot_number: e.target.value })}
                placeholder="e.g. 254712345678 (country code + number, no +)"
                className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
              <p className="text-[10px] text-emerald-600/50 font-bold mt-2">This is used for the "Chat on WhatsApp" button on your store. Just the digits, no + or spaces.</p>
            </div>

            {/* Notification Preferences */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">Notification Preferences</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                When a customer requests an item not in your catalog, where should the alert go?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setWaForm({ ...waForm, notification_preference: 'dashboard' })}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${waForm.notification_preference === 'dashboard' ? 'border-primary bg-primary/5' : 'border-border bg-slate-50'}`}>
                  <span className="text-sm font-bold block">📋 Dashboard</span>
                  <span className="text-[10px] text-slate-400 font-medium">Default — shows up in your dashboard notifications</span>
                </button>
                <button onClick={() => setWaForm({ ...waForm, notification_preference: 'whatsapp' })}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${waForm.notification_preference === 'whatsapp' ? 'border-primary bg-primary/5' : 'border-border bg-slate-50'}`}>
                  <span className="text-sm font-bold block">💬 WhatsApp</span>
                  <span className="text-[10px] text-slate-400 font-medium">Get a WhatsApp message directly</span>
                </button>
              </div>
              {waForm.notification_preference === 'whatsapp' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Your WhatsApp Number</label>
                  <input value={waForm.notification_phone} onChange={e => setWaForm({ ...waForm, notification_phone: e.target.value })}
                    placeholder="e.g. 254712345678 (country code + number)"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50" />
                </div>
              )}
            </div>

            {/* Webhook Setup */}
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Webhook Setup</h3>
                <button onClick={() => setShowInstructions(!showInstructions)} className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black hover:bg-blue-200 transition-colors">!</button>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Callback URL</p>
                  <code className="text-[11px] font-bold text-primary break-all">{process.env.NEXT_PUBLIC_APP_URL}/api/webhook</code>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Verify Token</p>
                  <code className="text-[11px] font-bold text-primary">{waVerifyToken || '(Token missing in server env)'}</code>
                </div>
              </div>
              {showInstructions && (
                <div className="mt-4 p-4 bg-white border border-blue-100 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">How to get your System Access Token</p>
                  <ul className="text-[10px] font-bold text-slate-500 space-y-2 list-decimal pl-4 mb-4 border-b border-slate-100 pb-4">
                    <li>Go to <strong>Business Settings</strong> in Meta Business Manager.</li>
                    <li>Under Users, click <strong>System Users</strong>.</li>
                    <li>Create a new System User (or select an existing one) with <strong>Admin</strong> role.</li>
                    <li>Click <strong>Generate New Token</strong>.</li>
                    <li>Select your App, and ensure you check: <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code>.</li>
                    <li>Copy the token and paste it into the <strong>System Access Token</strong> field above.</li>
                  </ul>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">How to verify your Webhook</p>
                  <ul className="text-[10px] font-bold text-slate-500 space-y-2 list-decimal pl-4">
                    <li>Go to your App in the <strong>Meta Developers Console</strong>.</li>
                    <li>Navigate to <strong>WhatsApp</strong> &gt; <strong>Configuration</strong>.</li>
                    <li>Under Webhook, click Edit.</li>
                    <li>Paste the <strong>Callback URL</strong> and <strong>Verify Token</strong> from above exactly as they appear.</li>
                    <li>Click <strong>Verify and Save</strong>.</li>
                    <li>Click <strong>Manage</strong> under Webhooks and subscribe to the <strong>"messages"</strong> field.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Test Connection */}
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Test Connection</h3>
                {org.wa_webhook_verified ? (
                  <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Active</span>
                ) : (
                  <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Inactive</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic">Send a test message to your phone to verify credentials are correct.</p>
              <div className="flex gap-2">
                <input value={testPhone} onChange={e => setTestPhone(e.target.value)}
                  placeholder="e.g. 254712345678"
                  className="flex-1 border border-border rounded-xl px-4 py-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm" />
                <button onClick={async () => {
                  setTestingBot(true); setTestResult(null);
                  try {
                    const r = await fetch('/api/settings/whatsapp/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test_phone: testPhone }) });
                    const data = await r.json();
                    if (data.success) { setTestResult({ success: true }); router.refresh(); }
                    else {
                      const errString = typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error);
                      if (errString.includes('190') || errString.includes('OAuthException') || errString.includes('Authentication Error')) {
                        setTestResult({ error: 'Your System Access Token is invalid or expired. Please generate a new permanent token in Meta Business Settings and save it above.' });
                      } else { setTestResult({ error: errString }); }
                    }
                  } catch (e) { setTestResult({ error: 'Network error' }); }
                  setTestingBot(false);
                }} disabled={testingBot || !testPhone}
                  className="bg-primary text-white p-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center aspect-square disabled:opacity-50">
                  {testingBot ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SendHorizonal size={20} />}
                </button>
              </div>
              {testResult?.error && <p className="text-[10px] text-red-500 font-bold bg-red-50 p-3 rounded-lg border border-red-100 italic">{testResult.error}</p>}
              {testResult?.success && <p className="text-[10px] text-green-600 font-bold bg-green-50 p-3 rounded-lg border border-green-100 italic font-serif">Success! Engine is now activated.</p>}
            </div>

            {/* User Manual / Field Guide */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">   Field Guide — What does each field mean?</h3>
              <div className="space-y-4 text-[11px] text-slate-600 font-medium leading-relaxed">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-black text-slate-700">📱 WhatsApp Phone ID</p>
                  <p className="mt-1">This is a <strong>number ID</strong> from Meta, NOT your phone number. It looks like <code className="text-primary">123456789012345</code>. Find it in Meta Developer Console → WhatsApp → API Setup. It tells Meta which phone line to send messages from.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-black text-slate-700">🔑 System Access Token</p>
                  <p className="mt-1">A <strong>permanent password</strong> for your bot to talk to Meta's servers. Create one in Meta Business Settings → System Users → Generate New Token. Check <code className="text-primary">whatsapp_business_messaging</code> permission. <strong>Never share this with anyone.</strong></p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-black text-slate-700">📞 Bot Number</p>
                  <p className="mt-1">Your actual WhatsApp business number that customers will message. Enter it without +, e.g. <code className="text-primary">254712345678</code> for a Kenyan number. This is used for the "Chat on WhatsApp" button on your store page.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-black text-slate-700">🌐 Webhook</p>
                  <p className="mt-1">A webhook is like a phone line for your bot — Meta calls it when a customer sends a message. The <strong>Callback URL</strong> and <strong>Verify Token</strong> above go into Meta Developer Console → WhatsApp → Configuration → Webhook. Once verified, your bot can receive messages.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-black text-slate-700">📋 Notifications</p>
                  <p className="mt-1">When a customer requests an item you don't have, you can see it in your <strong>Dashboard notifications</strong> (bell icon) or get a <strong>WhatsApp message</strong> directly. Choose what works for you.</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button onClick={async () => {
              setSaving(true);
              await fetch('/api/settings/whatsapp', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                  phone_number_id: waForm.phone_number_id,
                  access_token: waForm.access_token,
                  wa_bot_number: waForm.wa_bot_number,
                  wa_business_account_id: waForm.wa_business_account_id,
                  notification_preference: waForm.notification_preference,
                  notification_phone: waForm.notification_phone,
                })
              });
              setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
            }} disabled={saving}
              className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60">
              {saved ? '✓ All Saved' : saving ? 'Saving...' : 'Save WhatsApp Settings'}
            </button>
          </div>
        </SecureSection>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <SecureSection email={userEmail} onUnlock={() => setUnlockedTabs([...unlockedTabs, 'payments'])}>
          <div className="bg-card rounded-2xl border border-border p-8 max-w-xl shadow-sm">
            <h2 className="font-bold text-foreground italic font-serif text-lg text-primary text-center mb-6">Payment Methods</h2>

            {ALL_PAYMENT_METHODS.map((pm) => {
              const isEnabled = enabledMethods.includes(pm.type)
              const details = methodDetails[pm.type] || {}
              return (
                <div key={pm.type} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-black shadow-sm">
                        {pm.icon}
                      </div>
                      <div>
                        <p className="font-black text-sm text-[#075E54]">{pm.label}</p>
                        {pm.regions && <p className="text-[10px] text-muted-foreground font-medium">{pm.regions}</p>}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isEnabled} onChange={(e) => {
                        if (e.target.checked) {
                          setEnabledMethods([...enabledMethods, pm.type])
                        } else {
                          setEnabledMethods(enabledMethods.filter(t => t !== pm.type))
                          const d = { ...methodDetails }
                          delete d[pm.type]
                          setMethodDetails(d)
                        }
                      }} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {isEnabled && pm.fields && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      {pm.fields.map((field) => (
                        <div key={field.key}>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                          <input
                            value={details[field.key] || ''}
                            onChange={(e) => setMethodDetails({ ...methodDetails, [pm.type]: { ...details, [field.key]: e.target.value } })}
                            type={field.type || 'text'}
                            placeholder={field.placeholder}
                            className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold font-mono focus:border-primary focus:outline-none shadow-sm mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Custom payment method */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-black shadow-sm">+</div>
                  <p className="font-black text-sm text-[#075E54]">Custom Payment Method</p>
                </div>
                <button onClick={() => {
                  const name = prompt('Enter payment method name (e.g. "Cash App", "GCash"):')
                  if (name && name.trim()) {
                    const type = `custom_${Date.now()}`
                    setCustomMethods([...customMethods, { type, label: name.trim() }])
                    setEnabledMethods([...enabledMethods, type])
                  }
                }} className="text-xs font-bold text-primary hover:underline">+ Add Custom</button>
              </div>

              {customMethods.map((cm) => {
                const isEnabled = enabledMethods.includes(cm.type)
                const details = methodDetails[cm.type] || {}
                return (
                  <div key={cm.type} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={isEnabled} onChange={(e) => {
                            if (e.target.checked) setEnabledMethods([...enabledMethods, cm.type])
                            else setEnabledMethods(enabledMethods.filter(t => t !== cm.type))
                          }} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <p className="font-bold text-sm text-[#075E54]">{cm.label}</p>
                      </div>
                      <button onClick={() => {
                        setCustomMethods(customMethods.filter(c => c.type !== cm.type))
                        setEnabledMethods(enabledMethods.filter(t => t !== cm.type))
                        const d = { ...methodDetails }
                        delete d[cm.type]
                        setMethodDetails(d)
                      }} className="text-[10px] text-red-400 font-bold hover:text-red-600">Remove</button>
                    </div>
                    {isEnabled && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Details / Instructions</label>
                        <textarea
                          value={details.instruction || ''}
                          onChange={(e) => setMethodDetails({ ...methodDetails, [cm.type]: { ...details, instruction: e.target.value } })}
                          placeholder="e.g. Send to $cashtag, Phone: +1234567890"
                          rows={2}
                          className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold font-mono focus:border-primary focus:outline-none shadow-sm mt-1"
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              {enabledMethods.length === 0 && (
                <p className="text-xs text-muted-foreground font-medium text-center py-4">No payment methods enabled. Toggle the ones you want above.</p>
              )}
            </div>

            <button onClick={async () => {
              setSaving(true)
              const payload = {
                payment_methods: ALL_PAYMENT_METHODS
                  .filter(pm => enabledMethods.includes(pm.type))
                  .map(pm => ({ type: pm.type, label: pm.label, details: methodDetails[pm.type] || {} }))
                  .concat(
                    customMethods
                      .filter(cm => enabledMethods.includes(cm.type))
                      .map(cm => ({ type: cm.type, label: cm.label, details: methodDetails[cm.type] || {} }))
                  ),
              }
              await fetch('/api/settings/payments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
              setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
            }} disabled={saving}
              className="w-full bg-[#075E54] text-white py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-[#075E54]/20 transition-all disabled:opacity-60">
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Payment Methods'}
            </button>
          </div>
        </SecureSection>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
          <div className="bg-card rounded-3xl border border-border p-8 flex flex-col md:flex-row items-center justify-between shadow-sm gap-6">
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Current Plan</p>
              <h3 className="text-3xl font-serif font-black text-[#075E54] italic capitalize">
                {isOnTrial ? 'Trial / No Plan' : `${chosenPlan?.name || activePlan} Plan`}
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {isOnTrial
                  ? 'Choose a plan below to get started'
                  : trialDaysLeft > 0
                    ? `${trialDaysLeft} days remaining in trial`
                    : 'Subscription Active'
                }
              </p>
            </div>
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
               <CreditCard size={32} className="text-primary" />
            </div>
          </div>

          {isOnTrial ? (
            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map(plan => (
                <div key={plan.id} className="bg-card rounded-3xl p-8 border-2 border-border flex flex-col">
                  <div className="mb-6">
                    <h4 className="text-xl font-black text-[#075E54] font-serif italic">{plan.name}</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black">${plan.price}</span>
                      <span className="text-xs font-bold text-slate-400">/mo</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">{plan.trial}-Day Free Trial</span>
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
                  <a
                    href={`https://paystack.shop/pay/chatevo-${plan.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#075E54] text-white py-4 rounded-xl font-black text-sm text-center uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Start Free Trial — Choose {plan.name}
                  </a>
                </div>
              ))}
            </div>
          ) : chosenPlan ? (
            <div className="max-w-md mx-auto">
              <div className="bg-card rounded-3xl p-8 border-2 border-primary shadow-xl shadow-primary/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black text-[#075E54] font-serif italic">{chosenPlan.name}</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black">${chosenPlan.price}</span>
                      <span className="text-xs font-bold text-slate-400">/mo</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {chosenPlan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <CheckCircle2 size={10} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-bold text-slate-400 text-center mb-4">
                  {trialDaysLeft > 0
                    ? `You're on the ${chosenPlan.name} trial. Subscribe to continue after your trial ends.`
                    : 'Your subscription is active.'}
                </p>
                {trialDaysLeft > 0 && (
                  <a
                    href={`https://paystack.shop/pay/chatevo-${chosenPlan.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#075E54] text-white py-4 rounded-xl font-black text-sm text-center uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Pay Now — Subscribe to {chosenPlan.name}
                  </a>
                )}
              </div>
            </div>
          ) : null}
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
        <SecureSection email={userEmail} onUnlock={() => setUnlockedTabs([...unlockedTabs, 'ai'])}>
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
                  <option value="Chatevo">Chatevo Default (Groq/Llama)</option>
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

            {aiForm.provider !== 'Chatevo' && (
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


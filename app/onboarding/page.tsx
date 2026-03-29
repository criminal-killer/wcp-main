'use client'

import { LoadingStore } from '@/components/LoadingStore'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const BUSINESS_TYPES = [
  'Fashion & Clothing', 'Food & Beverages', 'Electronics', 'Beauty & Cosmetics',
  'Home & Furniture', 'Health & Wellness', 'Jewelry & Accessories', 'Handmade Crafts',
  'Groceries & Supermarket', 'Books & Stationery', 'Toys & Kids', 'Sports & Outdoors',
  'Other',
]

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', currency: 'KES', subtitle: 'East Africa' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', subtitle: 'West Africa' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', subtitle: 'West Africa' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', subtitle: 'Southern Africa' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', subtitle: 'East Africa' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', subtitle: 'East Africa' },
  { code: 'US', name: 'United States', currency: 'USD', subtitle: 'North America' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', subtitle: 'Europe' },
  { code: 'OTHER', name: 'Other', currency: 'USD', subtitle: 'Global' },
]

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    country: 'KE',
    business_type: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.business_type) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setError((data.error as string) || 'Something went wrong')
        setLoading(false)
        return
      }
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000) // Delay to show the beautiful loading state
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] relative overflow-hidden flex items-center justify-center p-6 font-outfit">
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.03]" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[0%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full" />

      {loading && <LoadingStore />}
      
      {/* Back Button */}
      <div className="absolute top-10 left-10 z-20">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold group bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-sm"
          >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back Home</span>
          </Link>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-white font-serif font-black text-3xl">S</span>
                </div>
            </div>
            <h1 className="text-5xl font-serif font-black text-[#075E54] mb-4 tracking-tight">
                Create Your <span className="text-primary italic">Store</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                Welcome, {user?.firstName}. Let's curate your digital storefront with SELLA.
            </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[40px] shadow-2xl p-10 md:p-16 relative overflow-hidden border border-slate-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid gap-10">
                {/* Store Name */}
                <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#075E54] ml-1">
                        Store Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. My Awesome Shop"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-slate-100 focus:border-primary px-0 py-4 text-2xl font-serif font-black outline-none transition-colors placeholder:text-slate-300 text-[#111B21]"
                        maxLength={100}
                        required
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Country */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#075E54] ml-1">
                            Country
                        </label>
                        <select
                            value={form.country}
                            onChange={(e) => setForm({ ...form, country: e.target.value })}
                            className="w-full bg-transparent border-b-2 border-slate-100 focus:border-primary px-0 py-4 text-lg font-bold outline-none transition-colors appearance-none text-[#111B21]"
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>{c.name} — {c.currency}</option>
                            ))}
                        </select>
                    </div>

                    {/* Business Type */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#075E54] ml-1">
                            Business Category
                        </label>
                        <select
                            value={form.business_type}
                            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                            className="w-full bg-transparent border-b-2 border-slate-100 focus:border-primary px-0 py-4 text-lg font-bold outline-none transition-colors appearance-none text-[#111B21]"
                            required
                        >
                            <option value="">Select Category...</option>
                            {BUSINESS_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 text-red-500 text-sm font-bold flex items-center gap-3 animate-shake">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {error}
              </div>
            )}

            <div className="pt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-6 rounded-full font-serif font-black text-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                    {loading ? 'Creating Store...' : 'Launch Store →'}
                </button>
                 <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-8 opacity-50">
                    Trusted by 500+ global brands
                </p>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex justify-between items-center px-6">
            <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                        U{i}
                    </div>
                ))}
            </div>
            <p className="text-xs font-bold text-muted-foreground">
                "Simple, professional, and efficient." — Sella Team
            </p>
        </div>
      </div>
    </div>
  )
}

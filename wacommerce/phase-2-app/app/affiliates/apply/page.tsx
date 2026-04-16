'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react'

export default function AffiliateApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    payment_details: '' // simple field for now
  })
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return alert('You must agree to the Terms & Conditions')
    
    setStatus('submitting')
    // Simulating API call
    setTimeout(() => {
      setStatus('success')
    }, 1500)
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-green-900/5">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#25D366]" />
          </div>
          <h1 className="text-3xl font-black font-serif mb-2">Application Received!</h1>
          <p className="text-muted-foreground font-medium mb-8">
            Thank you for applying to the Chatevo Affiliate Program. Our team will review your application and email you once approved.
          </p>
          <Link href="/" className="inline-block bg-[#25D366] text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-outfit">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block font-serif font-black text-2xl text-primary mb-6">Chatevo</Link>
          <h1 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-slate-900 mb-4">
            Become a Chatevo Partner
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            Earn 40% on the first payment and 10% recurring commissions for every merchant you refer to our WhatsApp Commerce platform.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="text-[#25D366]" />
              </div>
              <h3 className="font-bold text-lg mb-2">High Commissions</h3>
              <p className="text-sm text-slate-600">Get 40% upfront on the first month, and 10% lifetime recurring for every active user.</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Easy Payouts</h3>
              <p className="text-sm text-slate-600">Once you hit the $100 minimum threshold, withdraw your earnings directly to your bank or PayPal.</p>
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="john@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Phone Number (WhatsApp preferred)</label>
                <input required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="+254 700 000 000" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Payout Details</label>
                <input required value={formData.payment_details} onChange={e=>setFormData({...formData, payment_details: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="PayPal Email, Bank Name + Account, or related payment link" />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 h-32 overflow-y-auto">
                <p className="font-bold text-slate-800">Chatevo Affiliate Terms & Conditions</p>
                <p>1. Commissions are earned on successful, non-refunded payments.</p>
                <p>2. The minimum payout threshold is $100 USD.</p>
                <p>3. Self-referrals or creating fake accounts to generate commissions is strictly prohibited and will result in immediate ban and forfeiture of funds.</p>
                <p>4. You may not bid on branded search terms (e.g., "Chatevo coupon", "Chatevo discount") in paid advertising.</p>
                <p>5. Chatevo reserves the right to modify the commission structure with 30 days notice.</p>
              </div>

              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I have read and agree to the Chatevo Affiliate Terms & Conditions.
                </label>
              </div>

              <button 
                type="submit"
                disabled={status === 'submitting' || !agreed}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit Application'} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

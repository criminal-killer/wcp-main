'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, DollarSign, ArrowRight, ShieldCheck, AlertCircle, Clock } from 'lucide-react'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'already_applied' | 'error'

export default function AffiliateApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    payment_details: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [apiMessage, setApiMessage] = useState('')
  const [existingStatus, setExistingStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return alert('You must agree to the Terms & Conditions')

    setStatus('submitting')
    setApiMessage('')

    try {
      const res = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json() as { success?: boolean; message?: string; error?: string; status?: string }

      if (res.ok && data.success) {
        setStatus('success')
        setApiMessage(data.message || '')
      } else if (res.status === 409) {
        setStatus('already_applied')
        setExistingStatus(data.status || 'pending')
        setApiMessage(data.error || '')
      } else {
        setStatus('error')
        setApiMessage(data.error || 'An unexpected error occurred.')
      }
    } catch {
      setStatus('error')
      setApiMessage('Network error. Please check your connection and try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-green-900/5">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#25D366]" />
          </div>
          <h1 className="text-3xl font-black font-serif mb-2">Application Received!</h1>
          <p className="text-muted-foreground font-medium mb-2">
            {apiMessage || 'Our team will review your application and email you once approved.'}
          </p>
          <p className="text-sm text-slate-400 mb-8">Average review time: 2 business days.</p>
          <Link href="/" className="inline-block bg-[#25D366] text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'already_applied') {
    const isPending = existingStatus === 'pending'
    const isRejected = existingStatus === 'rejected'
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPending ? 'bg-amber-100' : isRejected ? 'bg-red-100' : 'bg-green-100'}`}>
            {isPending ? <Clock size={40} className="text-amber-500" /> : isRejected ? <AlertCircle size={40} className="text-red-500" /> : <CheckCircle2 size={40} className="text-[#25D366]" />}
          </div>
          <h1 className="text-2xl font-black font-serif mb-2">Application Already Exists</h1>
          <p className="text-slate-600 font-medium mb-2">{apiMessage}</p>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest mt-2 ${isPending ? 'bg-amber-100 text-amber-700' : isRejected ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            Status: {existingStatus}
          </div>
          {isPending && (
            <p className="text-xs text-slate-400 mt-4">Hang tight — we review applications within 2 business days.</p>
          )}
          <Link href="/" className="block mt-8 text-sm text-slate-500 hover:text-slate-800">← Back to Home</Link>
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
            Earn <strong>40%</strong> on the first payment and <strong>10% recurring</strong> commissions for every merchant you refer.
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
              <p className="text-sm text-slate-600">Once you hit the $100 minimum threshold, withdraw directly to your bank or PayPal.</p>
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
            {status === 'error' && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-red-700">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{apiMessage}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="jane@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Phone Number (WhatsApp preferred)</label>
                <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="+1 555 000 0000" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Payout Details</label>
                <input required value={formData.payment_details} onChange={e => setFormData({ ...formData, payment_details: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  placeholder="PayPal email, Bank Name + Account Number, or Wise" />
                <p className="text-xs text-slate-400">You can update this later from your affiliate dashboard.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 h-32 overflow-y-auto">
                <p className="font-bold text-slate-800">Chatevo Affiliate Terms &amp; Conditions</p>
                <p>1. Commissions are earned on successful, non-refunded payments only.</p>
                <p>2. The minimum payout threshold is $100 USD.</p>
                <p>3. Self-referrals or fake accounts will result in immediate ban and forfeiture of funds.</p>
                <p>4. You may not bid on branded search terms (e.g., &quot;Chatevo coupon&quot;) in paid advertising.</p>
                <p>5. Chatevo reserves the right to modify the commission structure with 30 days notice.</p>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I have read and agree to the Chatevo Affiliate Terms &amp; Conditions.
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

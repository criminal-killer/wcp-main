'use client'

import { useState, useEffect } from 'react'
import { useSignUp, useSignIn } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, ShieldCheck, DollarSign, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { createAffiliateAccount } from '@/app/actions/affiliates'

export default function AffiliateApplyPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    payment_details: '',
    referral_code: ''
  })
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'verify' | 'success'>('idle')
  const [verificationCode, setVerificationCode] = useState('')

  // Prefill referral code
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setFormData(prev => ({ ...prev, referral_code: ref }))
  }, [searchParams])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    if (!agreed) return toast.error('You must agree to the T&Cs')

    setStatus('submitting')
    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        username: formData.username,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStatus('verify')
      toast.success('Verification code sent to email')
    } catch (err: any) {
      console.error(err)
      toast.error(err.errors?.[0]?.longMessage || err.message || 'Error occurred during sign up')
      setStatus('idle')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setStatus('submitting')
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (completeSignUp.status === 'complete') {
        const clerkUserId = completeSignUp.createdUserId
        
        // Save in DB
        const res = await createAffiliateAccount({
          clerk_id: clerkUserId!,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          payment_details: formData.payment_details,
          referred_by_code: formData.referral_code
        })

        if (!res.success) {
          throw new Error(res.error)
        }

        await setActive({ session: completeSignUp.createdSessionId })
        setStatus('success')
        router.push('/affiliate-dashboard')
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2))
        setStatus('verify')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.errors?.[0]?.longMessage || err.message || 'Verification failed')
      setStatus('verify')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-outfit">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block font-serif font-black text-2xl text-primary mb-6">Chatevo</Link>
          <h1 className="text-4xl md:text-5xl font-black font-serif tracking-tight text-slate-900 mb-4">
            Join the Affiliate Network
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-4">
            Earn 40% on the first payment and 10% recurring commissions for every merchant you refer. Plus, earn 5% on Tier-1 withdrawals!
          </p>
          <Link href="/affiliates/login" className="text-sm font-bold text-[#25D366] hover:underline">
            Already have an account? Login here.
          </Link>
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
              <h3 className="font-bold text-lg mb-2">Multi-Tier Payouts</h3>
              <p className="text-sm text-slate-600">Earn 5% on your referrals' successful withdrawals, and an extra 2% on your tier 2 network!</p>
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
            {status === 'verify' ? (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-serif">Verify your email</h3>
                  <p className="text-sm text-slate-600">We've sent a code to {formData.email}. Please enter it below.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Verification Code</label>
                  <input required value={verificationCode} onChange={e=>setVerificationCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-mono" placeholder="123456" />
                </div>
                <button type="submit" disabled={status === 'submitting'} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center">
                  {status === 'submitting' ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                </button>
              </form>
            ) : status === 'success' ? (
               <div className="text-center py-10 space-y-4">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-[#25D366]" />
                  </div>
                 <h3 className="text-2xl font-black font-serif">Welcome aboard!</h3>
                 <p className="text-slate-600">Redirecting to your dashboard...</p>
               </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Username</label>
                    <input required value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="johndoe123" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Password</label>
                    <input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="••••••••" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Phone Number (WhatsApp preferred)</label>
                  <input required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="+254 700 000 000" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Payout Details</label>
                  <input required value={formData.payment_details} onChange={e=>setFormData({...formData, payment_details: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="PayPal Email or Bank Name + Account" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Referral Code (Optional)</label>
                  <input value={formData.referral_code} onChange={e=>setFormData({...formData, referral_code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" placeholder="Were you referred?" />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary rounded border-slate-300"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600">
                    I agree to the Chatevo Affiliate Terms & Conditions. No self-referrals.
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={status === 'submitting' || !agreed}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {status === 'submitting' ? <Loader2 className="animate-spin" /> : 'Join Network'} <ArrowRight size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

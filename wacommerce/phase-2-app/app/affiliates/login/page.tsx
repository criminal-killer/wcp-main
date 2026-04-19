'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AffiliateLoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setStatus('submitting')
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/affiliate-dashboard')
      } else {
        console.error(result)
        toast.error('Sign in requires additional steps.')
        setStatus('idle')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.errors?.[0]?.longMessage || err.message || 'Invalid email or password.')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
      <Toaster />
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-serif font-black text-2xl text-primary mb-2">Chatevo</Link>
          <h1 className="text-2xl font-black font-serif text-slate-900">Affiliate Login</h1>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Email Address</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" 
              placeholder="john@example.com" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Password</label>
            <input 
              required 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {status === 'submitting' ? <Loader2 className="animate-spin" /> : 'Log In'} <ArrowRight size={18} />
          </button>
          
          <div className="text-center pt-4">
            <Link href="/affiliates/apply" className="text-sm text-slate-500 hover:text-primary transition-colors">
              Don't have an affiliate account? Apply here.
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

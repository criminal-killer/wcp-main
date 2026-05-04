'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Key, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function SuperLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/super-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json()
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans selection:bg-primary selection:text-white">
      <div className="max-w-md w-full relative">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-10 shadow-2xl relative z-10 backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner group transition-all">
              <ShieldAlert className="text-emerald-500 group-hover:scale-110 transition-transform" size={40} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight text-center font-serif italic">Alfred's Backdoor</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mt-3 opacity-60">System Level Overide</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Master Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alfred.dev8@gmail.com"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all font-bold tracking-tight"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Access Token</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all font-bold tracking-tight"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <p className="text-red-400 text-xs font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <><span className="text-sm uppercase tracking-widest">Authenticate</span> <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-12 flex items-center justify-between opacity-30">
            <div className="h-px flex-1 bg-slate-800"></div>
            <span className="text-[8px] font-black text-slate-500 mx-4 uppercase tracking-[0.3em]">SECURE ACCESS POINT 7</span>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

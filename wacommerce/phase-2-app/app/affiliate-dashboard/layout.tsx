'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000 // 3 hours

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId, signOut } = useAuth()
  const router = useRouter()
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/affiliates/login')
    }
  }, [isLoaded, userId, router])

  // Inactivity tracking
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_LIMIT_MS) {
        signOut(() => router.push('/affiliates/login?expired=1'))
      }
    }, 60000) // check every minute

    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('click', updateActivity)
    window.addEventListener('scroll', updateActivity)

    return () => {
      clearInterval(checkInactivity)
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('scroll', updateActivity)
    }
  }, [signOut, router])

  if (!isLoaded || !userId) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="font-black font-serif text-2xl text-primary">Chatevo Affiliates</div>
        <button 
          onClick={() => signOut(() => router.push('/'))}
          className="text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          Sign Out
        </button>
      </header>
      
      <main className="max-w-6xl mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}

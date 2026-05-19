'use client'

import { MessageSquareText, Sparkles, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AnimatedLogo({ className = "w-16 h-16" }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className={`${className} bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 relative overflow-hidden`}>
        <span className="text-white font-serif font-black text-3xl">S</span>
      </div>
    )
  }

  return (
    <div className={`${className} bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 relative overflow-hidden group`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* The main chat bubble - bouncing gently */}
      <MessageSquareText size={32} className="text-white absolute animate-bounce" style={{ animationDuration: '3s' }} />
      
      {/* AI Bot/Shopping icon popping up from bottom */}
      <ShoppingBag size={20} className="text-white/90 absolute bottom-2 right-2 animate-pulse" style={{ animationDuration: '2s' }} />
      
      {/* Sparkles indicating AI in action selling */}
      <Sparkles size={16} className="text-yellow-300 absolute top-2 right-2 animate-pulse" />
      
      {/* Animated dots simulating chat typing */}
      <div className="absolute flex space-x-1 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1">
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

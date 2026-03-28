'use client'

import { useTheme } from 'next-themes'
import { Check, Moon, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'theme-emerald', name: 'WhatsApp Emerald', color: '#25D366' },
  { id: 'theme-midnight', name: 'Midnight Premium', color: '#0F172A', isDark: true },
  { id: 'theme-ocean', name: 'Ocean Depth', color: '#0EA5E9' },
  { id: 'theme-lavender', name: 'Lavender Luxury', color: '#8B5CF6' },
  { id: 'theme-rose', name: 'Boutique Rose', color: '#F43F5E' },
  { id: 'theme-amber', name: 'Amber Glow', color: '#F59E0B' },
  { id: 'theme-slate', name: 'Modern Slate', color: '#475569' },
  { id: 'theme-coffee', name: 'Artisan Coffee', color: '#78350F' },
  { id: 'theme-forest', name: 'Organic Forest', color: '#065F46' },
  { id: 'theme-crimson', name: 'Bold Crimson', color: '#991B1B' },
]

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
              theme === t.id 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-100 hover:border-gray-200 bg-white'
            }`}
          >
            <div 
              className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center text-white"
              style={{ backgroundColor: t.color }}
            >
              {theme === t.id && <Check size={20} className="drop-shadow-sm" />}
            </div>
            <span className={`text-xs font-bold ${theme === t.id ? 'text-primary' : 'text-gray-500'}`}>
              {t.name}
            </span>
            {t.isDark && (
              <div className="absolute top-2 right-2 p-1 bg-gray-900 text-yellow-400 rounded-lg">
                <Moon size={10} />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-4">
        Theme settings are saved automatically
      </p>
    </div>
  )
}

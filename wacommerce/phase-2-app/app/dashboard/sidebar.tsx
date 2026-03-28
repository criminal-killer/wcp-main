'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare,
  Users, Settings, Store, BarChart3, Globe, Shield,
  CheckCircle2, Plus, Menu, X, Bell
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface Org {
  name: string
  slug: string
  plan: string | null
  logo_url?: string | null
}

export default function DashboardSidebar({ org }: { org: Org }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 w-full h-14 bg-card border-b border-border flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#25D366] rounded-md flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-[10px]">{org.name[0]}</span>
          </div>
          <span className="font-bold text-sm tracking-tight truncate max-w-[150px]">{org.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/notifications" className="relative group">
            <Bell size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </Link>
          <button onClick={() => setIsOpen(true)}>
            <Menu size={24} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 shadow-2xl
        md:relative md:w-60 md:transform-none md:shadow-none md:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-4 right-4">
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-secondary">
            <X size={20} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      {/* Store Switcher */}
      <div className="p-4 border-b border-border">
        <div className="relative group">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-all border border-transparent hover:border-border">
            <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/20">
              <span className="text-white font-black text-sm">{org.name[0]}</span>
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-bold text-foreground text-xs truncate uppercase tracking-tight">{org.name}</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">{org.plan || 'trial'} plan</p>
            </div>
            <Shield size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>
          
          {/* Dropdown Meta-Logic Placeholder */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest px-3 py-2">My Organizations</p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-[#075E54] text-xs font-bold">
                <CheckCircle2 size={12} /> {org.name}
              </button>
              <Link href="/onboarding" className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary text-muted-foreground text-xs font-bold transition-colors">
                <Plus size={12} /> Add New Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-50 text-[#25D366]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#25D366]' : 'text-muted-foreground/70'} />
              {label}
              {label === 'Inbox' && (
                <span className="ml-auto bg-[#25D366] text-white text-xs px-1.5 py-0.5 rounded-full">
                  â€¢
                </span>
              )}
            </Link>
          )
        })}

        {/* Store link */}
        <div className="pt-3 mt-3 border-t border-border">
          <Link
            href={`/store/${org.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-all"
          >
            <Globe size={18} className="text-muted-foreground/70" />
            My Store Website
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">Account Settings</p>
        </div>
      </div>
    </aside>
  </>
  )
}

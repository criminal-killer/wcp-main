'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare,
  Users, Settings, Store, BarChart3, Globe, Shield,
  CheckCircle2, Plus, Menu, X, Bell, BookOpen
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/docs', label: 'Help & Docs', icon: BookOpen },
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
      {/* Mobile Top Header (Sticky) */}
      <div className="lg:hidden fixed top-0 left-0 w-full h-14 bg-card border-b border-border flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-whatsapp rounded-lg flex items-center justify-center shadow-lg shadow-whatsapp/20">
            <span className="text-white font-black text-xs">{org.name[0]}</span>
          </div>
          <span className="font-bold text-sm tracking-tight truncate max-w-[120px]">{org.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-card"></span>
          </Link>
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 text-foreground hover:bg-secondary rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Overlay (Backdrop) */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-[50] animate-in fade-in duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer (Aside) */}
      <aside className={`
        lg:hidden fixed inset-y-0 left-0 z-[60] w-[280px] bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-whatsapp rounded-lg flex items-center justify-center shadow-lg shadow-whatsapp/20">
              <span className="text-white font-black text-xs">{org.name[0]}</span>
            </div>
            <span className="font-bold text-sm">{org.name}</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pt-4">
           {/* Sidebar contents duplicated or extracted */}
           <NavContent pathname={pathname} org={org} />
        </div>
      </aside>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:flex-shrink-0 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="w-10 h-10 bg-whatsapp rounded-xl flex items-center justify-center shadow-lg shadow-whatsapp/20">
              <span className="text-white font-black text-lg">{org.name[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm truncate uppercase tracking-tighter">{org.name}</p>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-primary" />
                <p className="text-[10px] text-primary font-black uppercase tracking-widest">{org.plan || 'trial'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 py-4">
          <NavContent pathname={pathname} org={org} />
        </div>
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 p-2 hover:bg-secondary rounded-2xl transition-all group">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Settings</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavContent({ pathname, org }: { pathname: string; org: Org }) {
  return (
    <nav className="space-y-1 px-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              isActive
                ? 'bg-whatsapp/10 text-whatsapp shadow-sm shadow-whatsapp/5'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-whatsapp' : 'text-muted-foreground/50'} />
            {label}
            {label === 'Inbox' && (
              <span className="ml-auto bg-whatsapp text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg shadow-whatsapp/30">
                LIVE
              </span>
            )}
          </Link>
        )
      })}

      <div className="pt-6 mt-6 border-t border-border/50">
        <Link
          href={`/store/${org.slug}`}
          target="_blank"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all group"
        >
          <Globe size={20} className="text-muted-foreground/50 group-hover:text-whatsapp transition-colors" />
          My Store Website
        </Link>
      </div>
    </nav>
  )
}

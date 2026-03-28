'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare,
  Users, Settings, Store, BarChart3, Globe, Shield,
  CheckCircle2, Plus,
} from 'lucide-react'

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

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
      {/* Store Switcher */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative group">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
            <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/20">
              <span className="text-white font-black text-sm">{org.name[0]}</span>
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-xs truncate uppercase tracking-tight">{org.name}</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">{org.plan || 'trial'} plan</p>
            </div>
            <Shield size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>
          
          {/* Dropdown Meta-Logic Placeholder */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">My Organizations</p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-[#075E54] text-xs font-bold">
                <CheckCircle2 size={12} /> {org.name}
              </button>
              <Link href="/onboarding" className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-gray-500 text-xs font-bold transition-colors">
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
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#25D366]' : 'text-gray-400'} />
              {label}
              {label === 'Inbox' && (
                <span className="ml-auto bg-[#25D366] text-white text-xs px-1.5 py-0.5 rounded-full">
                  •
                </span>
              )}
            </Link>
          )
        })}

        {/* Store link */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <Link
            href={`/store/${org.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Globe size={18} className="text-gray-400" />
            My Store Website
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100 flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 truncate">Account Settings</p>
        </div>
      </div>
    </aside>
  )
}

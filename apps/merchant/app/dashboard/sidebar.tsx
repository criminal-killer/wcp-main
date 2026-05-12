'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare,
  Users, Settings, Store, BarChart3, Globe, Shield,
  CheckCircle2, Plus, Menu, X, Bell, BookOpen, HandCoins, Gift,
  ChevronDown, Check, Phone, Zap, Loader2
} from 'lucide-react'
import { useState, Fragment, useRef, useEffect, useCallback } from 'react'

type StoreItem = {
  id: string
  name: string
  slug: string
  is_default: number | null
  store_type: string | null
  wa_phone_number_id: string | null
  is_live: number | null
}
type OrgItem = { name: string; slug: string; plan: string | null; logo_url?: string | null }
type ActiveStoreItem = StoreItem | null

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/stores', label: 'Stores', icon: Store },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/docs', label: 'Help & Docs', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/affiliates/apply', label: 'Become Affiliate', icon: HandCoins },
  { href: '/dashboard/settings/referrals', label: 'Referrals', icon: Gift },
]

interface Org {
  name: string
  slug: string
  plan: string | null
  logo_url?: string | null
}

interface StoreStats {
  unreadMessages: number
  pendingOrders: number
  revenue: number
}

export default function DashboardSidebar({
  org, stores = [], activeStore, unreadCount = 0
}: {
  org: Org
  stores?: StoreItem[]
  activeStore?: ActiveStoreItem
  unreadCount?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [stats, setStats] = useState<StoreStats>({ unreadMessages: 0, pendingOrders: 0, revenue: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch stats for active store
  const fetchStats = useCallback(async () => {
    if (!activeStore) return
    try {
      const res = await fetch(`/api/stores/stats?store_id=${activeStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || { unreadMessages: 0, pendingOrders: 0, revenue: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch store stats:', err)
    }
  }, [activeStore?.id])

  // Poll stats every 30 seconds
  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStoreSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showStoreSwitcher = stores.length > 1

  // Switch store
  async function handleStoreSwitch(storeId: string) {
    if (storeId === activeStore?.id) {
      setStoreSwitcherOpen(false)
      return
    }
    setSwitching(true)
    try {
      const res = await fetch('/api/stores/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId }),
      })
      if (res.ok) {
        // Refresh page to reload with new store scope
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to switch store:', err)
    } finally {
      setSwitching(false)
      setStoreSwitcherOpen(false)
    }
  }

  // Store type badge colors
  function getStoreTypeBadge(type: string | null) {
    switch (type) {
      case 'physical':
        return { bg: 'bg-blue-100 text-blue-700', label: 'Physical' }
      case 'digital':
        return { bg: 'bg-purple-100 text-purple-700', label: 'Digital' }
      case 'services':
        return { bg: 'bg-amber-100 text-amber-700', label: 'Services' }
      default:
        return { bg: 'bg-gray-100 text-gray-700', label: 'Store' }
    }
  }

  const typeBadge = getStoreTypeBadge(activeStore?.store_type || null)
  const hasWhatsApp = !!activeStore?.wa_phone_number_id

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
            {(unreadCount > 0 || stats.unreadMessages > 0) && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full px-1 shadow-lg">
                {(unreadCount + stats.unreadMessages) > 99 ? '99+' : (unreadCount + stats.unreadMessages)}
              </span>
            )}
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
          <NavContent pathname={pathname} org={org} />
        </div>
      </aside>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:flex-shrink-0 bg-card border-r border-border h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <div className="relative" ref={dropdownRef}>
            {/* Org header with active store */}
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${showStoreSwitcher ? 'bg-secondary/50 border-border/50 cursor-pointer hover:bg-secondary' : 'bg-secondary/50 border-border/50'}`}
              onClick={() => showStoreSwitcher && setStoreSwitcherOpen(!storeSwitcherOpen)}
            >
              <div className="w-10 h-10 bg-whatsapp rounded-xl flex items-center justify-center shadow-lg shadow-whatsapp/20 relative">
                <span className="text-white font-black text-lg">{activeStore?.name?.[0] || org.name[0]}</span>
                {activeStore && (
                  <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${activeStore.is_live === 1 ? 'bg-green-500' : 'bg-amber-500'}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-foreground text-sm truncate uppercase tracking-tighter">
                    {activeStore?.name || org.name}
                  </p>
                  {showStoreSwitcher && (
                    <ChevronDown size={12} className={`text-muted-foreground flex-shrink-0 transition-transform ${storeSwitcherOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${typeBadge.bg}`}>
                    {typeBadge.label}
                  </span>
                  {hasWhatsApp ? (
                    <span className="flex items-center gap-1 text-[9px] text-green-600">
                      <Phone size={8} /> WhatsApp
                    </span>
                  ) : (
                    <span className="text-[9px] text-amber-600">Not connected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Store Switcher Dropdown */}
            {showStoreSwitcher && storeSwitcherOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1">Switch Store</p>
                  {stores.map(store => {
                    const badge = getStoreTypeBadge(store.store_type)
                    const isActive = store.id === activeStore?.id
                    return (
                      <button
                        key={store.id}
                        onClick={() => handleStoreSwitch(store.id)}
                        disabled={switching}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          isActive ? 'bg-whatsapp/10 text-whatsapp' : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {switching && isActive ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Store size={14} className={isActive ? 'text-whatsapp' : 'text-muted-foreground'} />
                        )}
                        <span className="flex-1 text-left truncate">{store.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {isActive && <Check size={12} className="text-whatsapp" />}
                      </button>
                    )
                  })}
                  <div className="border-t border-border mt-1 pt-1">
                    <Link
                      href="/dashboard/stores"
                      onClick={() => setStoreSwitcherOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Plus size={12} />
                      Manage Stores
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats for Active Store */}
          {activeStore && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link
                href="/dashboard/inbox"
                className="bg-secondary/50 rounded-lg p-2 text-center hover:bg-secondary transition-colors"
              >
                <div className="text-lg font-black text-foreground">{stats.unreadMessages}</div>
                <div className="text-[9px] text-muted-foreground font-medium">Messages</div>
              </Link>
              <Link
                href="/dashboard/orders"
                className="bg-secondary/50 rounded-lg p-2 text-center hover:bg-secondary transition-colors"
              >
                <div className="text-lg font-black text-foreground">{stats.pendingOrders}</div>
                <div className="text-[9px] text-muted-foreground font-medium">Orders</div>
              </Link>
              <Link
                href={`/dashboard/stores/${activeStore.id}`}
                className="bg-secondary/50 rounded-lg p-2 text-center hover:bg-secondary transition-colors"
              >
                <div className="text-lg font-black text-green-600">${stats.revenue.toFixed(0)}</div>
                <div className="text-[9px] text-muted-foreground font-medium">Revenue</div>
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <NavContent pathname={pathname} org={org} />
        </div>

        <div className="p-4 border-t border-border mt-auto space-y-2">
          {/* Launch Store Button */}
          {activeStore && activeStore.is_live !== 1 && (
            <Link
              href={`/dashboard/stores/${activeStore.id}`}
              className="flex items-center gap-2 w-full bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
            >
              <Zap size={16} />
              Launch Store
            </Link>
          )}
          <div className="flex items-center gap-3 p-2 hover:bg-secondary rounded-2xl transition-all group cursor-pointer">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">My Profile</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="w-full flex items-center gap-3 p-2 hover:bg-red-50 text-red-600 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <X size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Logout</span>
          </button>
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
        const isEarnSection = label === 'Become Affiliate'

        return (
          <Fragment key={href}>
            {isEarnSection && (
              <div className="pt-4 mt-4 mb-2 border-t border-border/50">
                <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Earn</p>
              </div>
            )}
            <Link
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
          </Fragment>
        )
      })}

      <div className="pt-6 mt-6 border-t border-border/50">
        <Link
          href="/dashboard/my-store"
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

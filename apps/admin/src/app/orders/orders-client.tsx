'use client'

import { useState, useEffect } from 'react'
import { Search, Package, ChevronDown, Loader2, Eye, ExternalLink } from 'lucide-react'

type Order = {
  id: string
  org_id: string
  order_number: string
  total: number | null
  currency: string | null
  order_status: string | null
  payment_status: string | null
  payment_method: string | null
  delivery_address: string | null
  items: string | null
  created_at: string | null
  org_name: string | null
  contact_name: string | null
  contact_phone: string | null
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (paymentFilter) params.set('payment_status', paymentFilter)
      params.set('limit', '100')
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.data || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [search, statusFilter, paymentFilter])

  const statuses = ['', 'new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
  const paymentStatuses = ['', 'pending', 'paid', 'failed', 'refunded']

  function getStatusColor(status: string | null) {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50'
      case 'confirmed': return 'text-indigo-600 bg-indigo-50'
      case 'preparing': return 'text-amber-600 bg-amber-50'
      case 'shipped': return 'text-purple-600 bg-purple-50'
      case 'delivered': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-slate-400 bg-slate-50'
    }
  }

  function getPaymentColor(status: string | null) {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-amber-600 bg-amber-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'refunded': return 'text-blue-600 bg-blue-50'
      default: return 'text-slate-400 bg-slate-50'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" />
            Orders
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {orders.length} orders across all organizations
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              placeholder="Search order #, customer, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-72"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statuses.filter(Boolean).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">All Payments</option>
              {paymentStatuses.filter(Boolean).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Order</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Customer</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Organization</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Total</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Status</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Payment</th>
                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-400 mt-2">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-bold text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-sm text-slate-900">#{order.order_number}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{order.id.slice(0, 12)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-700">{order.contact_name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{order.contact_phone || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-700">{order.org_name || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-sm text-slate-900">{order.currency || 'USD'} {order.total || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(order.order_status)}`}>
                      {order.order_status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${getPaymentColor(order.payment_status)}`}>
                      {order.payment_status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

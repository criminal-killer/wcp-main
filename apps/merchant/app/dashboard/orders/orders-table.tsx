'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  total: number
  currency: string
  payment_status: string | null
  order_status: string | null
  payment_method: string | null
  created_at: string | null
  contact_name: string | null
  contact_phone: string | null
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-cyan-100 text-cyan-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
}
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-secondary/50 text-muted-foreground',
}

export default function OrdersTable({ orders, currency }: { orders: Order[]; currency: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filtered = orders.filter(o => {
    const matchesSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.contact_phone || '').includes(search)
    const matchesStatus = !statusFilter || o.order_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by order # or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
        />
        <button
          onClick={() => setStatusFilter(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${!statusFilter ? 'bg-[#25D366] text-white border-[#25D366]' : 'border-border text-muted-foreground hover:border-[#25D366] hover:text-[#25D366]'}`}
        >
          All
        </button>
        {['new', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${statusFilter === status ? 'bg-[#25D366] text-white border-[#25D366]' : 'border-border text-muted-foreground hover:border-[#25D366] hover:text-[#25D366]'}`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Order</th>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Payment</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  {search || statusFilter ? 'No orders match your filters' : 'No orders yet'}
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id} className="hover:bg-secondary transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-foreground text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground/70">{order.payment_method || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground text-sm">{order.contact_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground/70">{order.contact_phone}</p>
                  </td>
                  <td className="px-5 py-3 font-bold text-foreground text-sm">
                    {currency} {order.total.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_COLORS[order.payment_status || 'pending']}`}>
                      {order.payment_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.order_status || 'new']}`}>
                      {order.order_status || 'new'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(order.created_at!).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-sm text-[#25D366] font-medium hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

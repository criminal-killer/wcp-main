'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Truck, Package, RefreshCw } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  payment_status: string
  order_status: string
  contact_phone: string | null
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', icon: Package, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { value: 'processing', label: 'Processing', icon: RefreshCw, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
]

export default function OrderActions({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showConfirmPayment, setShowConfirmPayment] = useState(false)

  async function updateStatus(newStatus: string, type: 'order_status' | 'payment_status') {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type]: newStatus,
          notify_customer: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Status updated! Customer will be notified.` })
        // Reload page to show updated status
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment Status */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Payment</p>
        {order.payment_status === 'paid' ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle size={16} />
            <span className="font-bold">Paid</span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => updateStatus('paid', 'payment_status')}
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Confirm Payment Received
            </button>
          </div>
        )}
      </div>

      {/* Order Status */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Order Status</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value, 'order_status')}
              disabled={loading || order.order_status === opt.value}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 ${
                order.order_status === opt.value
                  ? `${opt.color} ring-2 ring-offset-1 ring-current`
                  : 'bg-secondary text-muted-foreground hover:bg-gray-200'
              }`}
            >
              <opt.icon size={16} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Updating status will send a WhatsApp notification to the customer.
      </p>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Truck, XCircle, AlertCircle, Sparkles } from 'lucide-react'

export default function OrderActions({ orderId, currentStatus, currentPayment }: { orderId: string, currentStatus: string, currentPayment: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [payment, setPayment] = useState(currentPayment)
  const router = useRouter()

  const updateStatus = async (newStatus: string, newPayment?: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: newStatus,
          payment_status: newPayment || payment,
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      setStatus(newStatus)
      if (newPayment) setPayment(newPayment)
      router.refresh()
    } catch (err) {
      alert('Error updating order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {payment === 'pending' && (
        <button 
          onClick={() => updateStatus(status, 'paid')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
        >
          <CheckCircle2 size={16} /> Mark as Paid
        </button>
      )}

      <select 
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={loading}
        className="px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#25D366] outline-none"
      >
        <option value="new">New</option>
        <option value="confirmed">Confirmed</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {status === 'shipped' && (
        <button 
          onClick={() => {
            const track = prompt('Enter Tracking Number:')
            if (track) updateStatus('shipped', payment) // In real world would save track too
          }}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Add Tracking"
        >
          <Sparkles size={18} />
        </button>
      )}
    </div>
  )
}

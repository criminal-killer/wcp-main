import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { users, organizations, orders, contacts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { ArrowLeft, Package, ShoppingCart, CreditCard, MapPin, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'

interface OrderDetail {
  id: string
  order_number: string
  items: string
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  currency: string
  payment_method: string | null
  payment_status: string
  payment_reference: string | null
  order_status: string
  delivery_address: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  // Fetch order scoped by org
  const order = await db.select({
    id: orders.id,
    order_number: orders.order_number,
    items: orders.items,
    subtotal: orders.subtotal,
    delivery_fee: orders.delivery_fee,
    discount: orders.discount,
    total: orders.total,
    currency: orders.currency,
    payment_method: orders.payment_method,
    payment_status: orders.payment_status,
    payment_reference: orders.payment_reference,
    order_status: orders.order_status,
    delivery_address: orders.delivery_address,
    notes: orders.notes,
    created_at: orders.created_at,
    updated_at: orders.updated_at,
    contact_name: contacts.name,
    contact_phone: contacts.phone,
    contact_email: contacts.email,
  })
    .from(orders)
    .leftJoin(contacts, eq(orders.contact_id, contacts.id))
    .where(and(
      eq(orders.id, params.id),
      eq(orders.org_id, user.org_id!)
    ))
    .limit(1)

  if (!order.length) {
    notFound()
  }

  const o = order[0] as unknown as OrderDetail

  // Parse items
  let items: Array<{ name: string; quantity: number; price: number }> = []
  try {
    items = JSON.parse(o.items || '[]')
  } catch {
    items = []
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-amber-100 text-amber-700 border-amber-200',
    shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }

  const paymentColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    refunded: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Order {o.order_number}</h1>
          <p className="text-muted-foreground text-sm">
            {o.created_at ? new Date(o.created_at).toLocaleString() : 'Unknown date'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Package size={18} /> Order Items
            </h2>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold">{o.currency} {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No items found</p>
            )}
          </div>

          {/* Payment & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <CreditCard size={18} /> Payment
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${paymentColors[o.payment_status] || 'bg-gray-100'}`}>
                    {o.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{o.payment_method || 'N/A'}</span>
                </div>
                {o.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ref</span>
                    <span className="font-mono text-sm">{o.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <ShoppingCart size={18} /> Status
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${statusColors[o.order_status] || 'bg-gray-100'}`}>
                    {o.order_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">{o.delivery_fee! > 0 ? `${o.currency} ${o.delivery_fee}` : 'Free'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {o.delivery_address && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <MapPin size={18} /> Delivery Address
              </h2>
              <p className="text-muted-foreground">{o.delivery_address}</p>
            </div>
          )}

          {/* Notes */}
          {o.notes && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold mb-4">Notes</h2>
              <p className="text-muted-foreground">{o.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Phone size={18} /> Customer
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold">
                  {o.contact_name?.[0] || o.contact_phone?.[0] || '?'}
                </div>
                <div>
                  <p className="font-medium">{o.contact_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{o.contact_phone}</p>
                </div>
              </div>
              {o.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{o.contact_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold mb-4">Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{o.currency} {o.subtotal.toFixed(2)}</span>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{o.currency} {o.discount.toFixed(2)}</span>
                </div>
              )}
              {o.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{o.currency} {o.delivery_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{o.currency} {o.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
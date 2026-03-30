import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { orders, contacts, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { ChevronLeft, Package, User, CreditCard, MapPin, Calendar, Clock, CheckCircle2, Truck, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import OrderActions from './order-actions'

export const dynamic = 'force-dynamic'

interface OrderItem {
  product_id: string
  name: string
  price: number
  qty: number
  image?: string
  variant?: string
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, params.id), eq(orders.org_id, user.org_id)),
  })

  if (!order) redirect('/dashboard/orders')

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, order.contact_id),
  })

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })

  const items = JSON.parse(order.items) as OrderItem[]

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              Order {order.order_number}
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.payment_status}
              </span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest flex items-center gap-2 mt-1">
              <Calendar size={12} /> {new Date(order.created_at!).toLocaleDateString()} at {new Date(order.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <OrderActions orderId={order.id} currentStatus={order.order_status || 'new'} currentPayment={order.payment_status || 'pending'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items & Fulfillment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-600">
                <Package size={16} /> Items ({items.length})
              </h3>
            </div>
            <div className="divide-y divide-border/50">
              {items.map((item, idx) => (
                <div key={idx} className="p-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      {item.variant ? `Variant: ${item.variant} · ` : ''}
                      Qty: {item.qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-foreground">{order.currency} {(item.price * item.qty).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{order.currency} {item.price.toLocaleString()} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-6 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{order.currency} {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Delivery ({order.delivery_zone || 'Global'})</span>
                <span>{order.currency} {order.delivery_fee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-foreground border-t border-slate-200 pt-3">
                <span>Total</span>
                <span>{order.currency} {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Manual Payment Verification (Conditional) */}
          {order.payment_method === 'manual' && order.payment_status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 space-y-4 animate-pulse-subtle">
              <div className="flex items-center gap-4 text-amber-700">
                <AlertCircle size={32} />
                <div>
                  <h3 className="font-black text-lg italic font-serif">Manual Verification Required</h3>
                  <p className="text-sm font-bold opacity-80">The customer has submitted proof of payment.</p>
                </div>
              </div>
              
              <div className="bg-white border border-amber-200 rounded-xl p-6 font-mono text-xs font-bold text-slate-600 shadow-sm leading-relaxed whitespace-pre-wrap">
                {order.payment_proof || 'No proof content provided yet.'}
              </div>

              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Merchant Note:</p>
                <p className="text-[10px] font-bold text-amber-700 italic">Verify this against your statement before marking as Paid.</p>
              </div>
            </div>
          )}

          {/* Timeline / Progress */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 space-y-6">
             <h3 className="font-bold text-sm text-slate-600 uppercase tracking-widest">Order Progress</h3>
             <div className="relative space-y-8">
               <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />
               {[
                 { status: 'new', icon: Clock, label: 'Order Created', date: order.created_at },
                 { status: 'confirmed', icon: CheckCircle2, label: 'Payment Verified', date: order.payment_status === 'paid' ? order.updated_at : null },
                 { status: 'shipped', icon: Truck, label: 'Shipped to Customer', date: order.order_status === 'shipped' ? order.updated_at : null },
                 { status: 'delivered', icon: Package, label: 'Delivered', date: order.order_status === 'delivered' ? order.updated_at : null },
               ].map((step, idx) => {
                 const isDone = !!step.date
                 return (
                   <div key={idx} className="relative flex items-center gap-6">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                       isDone ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' : 'bg-white border-slate-200 text-slate-300'
                     }`}>
                       <step.icon size={16} />
                     </div>
                     <div>
                       <p className={`text-sm font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                       {isDone && <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                         {new Date(step.date!).toLocaleDateString()}
                       </p>}
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>
        </div>

        {/* Right Column: Customer & Shipping */}
        <div className="space-y-8">
          {/* Customer */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
             <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Customer Details</h3>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">
                  {contact?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-bold text-foreground truncate">{contact?.name || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground font-medium">{contact?.phone}</p>
                </div>
             </div>
             <div className="pt-4 border-t border-border/50">
               <Link href={`/dashboard/inbox?phone=${contact?.phone}`} className="text-xs font-black text-[#25D366] uppercase tracking-widest hover:underline flex items-center gap-2">
                 Chat on WhatsApp →
               </Link>
             </div>
          </div>

          {/* Shipping */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
             <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Fulfillment</h3>
             <div className="space-y-4">
               <div className="flex items-start gap-3">
                 <MapPin size={18} className="text-slate-400 mt-1 shrink-0" />
                 <div>
                   <p className="text-xs font-black uppercase text-slate-400 tracking-tighter mb-1">Shipping Address</p>
                   <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{order.delivery_address || 'No address provided'}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <CreditCard size={18} className="text-slate-400 mt-1 shrink-0" />
                 <div>
                   <p className="text-xs font-black uppercase text-slate-400 tracking-tighter mb-1">Payment Method</p>
                   <p className="text-sm font-bold text-slate-600 capitalize">{order.payment_method?.replace('_', ' ')}</p>
                 </div>
               </div>
               {order.tracking_number && (
                 <div className="flex items-start gap-3">
                   <Truck size={18} className="text-slate-400 mt-1 shrink-0" />
                   <div>
                     <p className="text-xs font-black uppercase text-slate-400 tracking-tighter mb-1">Tracking ID</p>
                     <p className="text-sm font-bold text-indigo-600 font-mono">{order.tracking_number}</p>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
             <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Internal Notes</h3>
             <div className="text-xs font-medium text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px]">
                {order.notes || 'No internal notes added yet.'}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

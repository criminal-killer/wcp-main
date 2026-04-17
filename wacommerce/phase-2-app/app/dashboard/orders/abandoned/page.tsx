'use client'
import { useState, useEffect } from 'react'
import { ShoppingCart, Clock, User, MessageSquare, ArrowRight, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/carts/abandoned')
      .then(res => res.json())
      .then(data => {
        setCarts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-whatsapp" /> Abandoned Carts
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">
            Recover sales from users who didn't finish their checkout
          </p>
        </div>
        <Badge variant="outline" className="w-fit h-fit bg-whatsapp/5 text-whatsapp border-whatsapp/20 font-black">
          GROWTH FEATURE
        </Badge>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : carts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-slate-50/50 rounded-3xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No abandoned carts found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">
            The system will automatically list customers who add items to their cart via WhatsApp but don't complete the payment.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {carts.map((entry: any) => (
            <Card key={entry.cart.id} className="p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                 <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold uppercase tracking-tighter text-[10px]">
                    Abandoned {new Date(entry.cart.updated_at).toLocaleDateString()}
                 </Badge>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-whatsapp/10 rounded-2xl flex items-center justify-center text-whatsapp shadow-inner shadow-whatsapp/5">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight truncate max-w-[200px]">
                      {entry.contact.name || 'Anonymous Customer'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold group-hover:text-whatsapp transition-colors">
                      {entry.contact.phone}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Items</span>
                    <span className="text-sm font-bold text-slate-700">
                      {JSON.parse(entry.cart.items || '[]').length} Products
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Total Value</span>
                    <span className="text-sm font-black text-slate-900 italic">
                      {entry.cart.total?.toLocaleString()} {entry.cart.currency}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-whatsapp text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-whatsapp/20 hover:scale-105 active:scale-95 transition-all">
                       Rescue via WhatsApp <MessageSquare size={16} />
                    </button>
                    <button className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                       <Trash2 size={20} />
                    </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {!loading && carts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
           <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
             <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 font-serif">Potential Recovery</p>
             <p className="text-2xl font-black text-emerald-700 italic">
               {carts.reduce((acc, c) => acc + (c.cart.total || 0), 0).toLocaleString()} KES
             </p>
           </div>
           
           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-serif">Success Rate</p>
             <p className="text-2xl font-black text-slate-900 italic">0%</p>
           </div>

           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-serif">Average Cart</p>
             <p className="text-2xl font-black text-slate-900 italic">
               {(carts.reduce((acc, c) => acc + (c.cart.total || 0), 0) / carts.length).toFixed(0)} KES
             </p>
           </div>
        </div>
      )}
    </div>
  )
}

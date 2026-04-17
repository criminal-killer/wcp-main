import { Bot, Package, Smartphone, BarChart3, Users, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Bot, title: 'AI Sales Agent', desc: 'Your WhatsApp number becomes a 24/7 AI agent that takes orders, answers questions, and processes payments automatically.' },
  { icon: Package, title: 'Product Catalog', desc: 'Add unlimited products with images, variants, and inventory tracking. Customers browse and buy without leaving WhatsApp.' },
  { icon: Smartphone, title: 'M-Pesa & Paybill', desc: 'Customers pay via MPesa, Paybill, or bank. You get notified, confirm, and the order is fulfilled — all in the same chat.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Track revenue, best-selling products, peak hours, and customer behavior in a clean dashboard built for mobile merchants.' },
  { icon: Users, title: 'Customer CRM', desc: 'Every customer becomes a contact with order history, chat history, and spend analytics automatically.' },
  { icon: Zap, title: 'Order Automation', desc: 'Auto-confirm payments, send tracking updates, trigger follow-ups, and recover abandoned carts — all automated.' },
]

export function Features() {
  return (
    <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
      <div className="mb-14">
        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">Everything you need</p>
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Built for Kenyan merchants</h2>
        <p className="text-slate-500 mt-3 text-lg max-w-xl">
          Stop losing sales to ignored WhatsApp messages. Chatevo handles the full commerce flow automatically.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {FEATURES.map(f => (
          <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all bg-white">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <f.icon size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

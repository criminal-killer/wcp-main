import Link from 'next/link'
import { BookOpen, ShoppingBag, MessageSquare, Zap, ArrowRight, Home } from 'lucide-react'

const docsSections = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn how to set up your Sella store, configure your WhatsApp connection, and start selling.',
    steps: [
      'Connect your WhatsApp Business API number.',
      'Configure your store details (currency, theme).',
      'Add your first product to the catalog.',
      'Test your WhatsApp checkout flow.'
    ]
  },
  {
    title: 'Products & Orders',
    icon: ShoppingBag,
    description: 'Manage your inventory, process orders, and fulfill deliveries.',
    steps: [
      'Create products with images, prices, and variants.',
      'View incoming orders directly in the Order Management tab.',
      'Update order status (Processing -> Shipped -> Delivered).',
      'Track your daily revenue and order metrics.'
    ]
  },
  {
    title: 'WhatsApp Inbox & AI',
    icon: MessageSquare,
    description: 'Chat directly with your customers and let the AI assistant handle FAQs.',
    steps: [
      'View and reply to WhatsApp messages in real-time.',
      'Set up Auto-Replies for common keywords.',
      'Enable the AI Assistant to automatically suggest products based on customer queries.',
      'Assign tags and notes to CRM contacts.'
    ]
  },
  {
    title: 'Automations & Webhooks',
    icon: Zap,
    description: 'Understand how payments and WhatsApp webhooks trigger actions automatically.',
    steps: [
      'When a customer approves a cart on WhatsApp, it appears in Sella instantly.',
      'Successful Paystack/Stripe/PayPal payments automatically mark the order as "Paid".',
      'Order status changes generate automated WhatsApp receipt messages.',
      'Webhook failures are logged for easy debugging.'
    ]
  }
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-outfit">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif font-black text-2xl tracking-tighter text-primary">
              SELLA
            </Link>
            <span className="text-muted-foreground font-medium text-sm border-l border-border pl-4">
              Documentation
            </span>
          </div>
          <Link href="/dashboard" className="text-sm font-bold bg-secondary px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-emerald-950 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-900/50 border border-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold text-emerald-300">
            <BookOpen size={16} /> Official Guide
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-white tracking-tight">
            How to use SELLA
          </h1>
          <p className="text-emerald-100/70 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Everything you need to know about setting up your WhatsApp Commerce platform, processing orders, and scaling your business.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {docsSections.map((section, idx) => {
            const Icon = section.icon
            return (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-border group hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#25D366] transition-colors">
                  <Icon size={24} className="text-[#25D366] group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl font-black font-serif tracking-tight mb-3">
                  {section.title}
                </h2>
                <p className="text-muted-foreground font-medium mb-6">
                  {section.description}
                </p>
                <ul className="space-y-3">
                  {section.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-slate-500">{stepIdx + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer CTA */}
      <section className="border-t border-border bg-white py-24 text-center px-4">
        <h2 className="font-serif text-4xl mb-6 tracking-tight">Need more help?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto font-medium">
          If you can't find what you're looking for, our support team is ready to help you set up your store.
        </p>
        <Link href="/dashboard/settings/support" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold hover:-translate-y-1 hover:shadow-xl transition-all shadow-green-500/20 shadow-lg">
          Contact Support <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}

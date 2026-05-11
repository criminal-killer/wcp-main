'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Mail, Phone, Info, CheckCircle2,
  ArrowLeft, Send, Calendar, Clock, ShieldCheck,
  MessageCircle, ChevronDown, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

const SUPPORT_CONTACTS = [
  { label: '🇺🇸 USA / International', number: '+16416712105' },
  { label: '🇰🇪 Kenya / Africa', number: '+254762667048' },
]

export default function SetupBookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedContact, setSelectedContact] = useState('')
  const [chatForm, setChatForm] = useState({
    name: '',
    location: '',
    message: '',
  })
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    businessInfo: '',
    preferredTime: '',
  })

  function openWhatsApp(number: string, name: string, location: string, message: string) {
    const text = `Hi, my name is ${name || '[Your name]'} from ${location || '[Your location]'}${message ? `. ${message}` : ''}`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/${number.replace('+', '')}?text=${encoded}`, '_blank')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'setup',
          subject: 'New Setup Booking Requested',
          description: formData.businessInfo,
          metadata: {
            email: formData.email,
            whatsapp: formData.whatsapp,
            preferred_time: formData.preferredTime,
          }
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedContact) return
    const contact = SUPPORT_CONTACTS.find(c => c.number === selectedContact)
    if (!contact) return
    openWhatsApp(contact.number, chatForm.name, chatForm.location, chatForm.message)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center">
        <div className="w-20 h-20 bg-green-50 text-[#25D366] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Booking Received!</h1>
        <p className="text-xl text-muted-foreground mb-10 font-medium">
          Our team has been notified. We will reach out to you via WhatsApp and Email to finalize your store setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black hover:bg-green-600 transition-all shadow-lg shadow-green-100"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Chat with Support - Toggle */}
      <div className="bg-card rounded-3xl border border-border p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="font-black text-foreground text-sm uppercase tracking-tight">Chat with Support Team</h2>
              <p className="text-xs text-muted-foreground">Get instant help via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-xl transition-all ${showChat ? 'bg-secondary rotate-180' : 'bg-whatsapp/10 text-whatsapp hover:bg-whatsapp/20'}`}
          >
            <ChevronDown size={18} className={showChat ? '' : 'text-whatsapp'} />
          </button>
        </div>

        {showChat && (
          <form onSubmit={handleChatSubmit} className="space-y-4 mt-4 border-t border-border pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Your Name *</label>
                <input
                  required
                  type="text"
                  value={chatForm.name}
                  onChange={e => setChatForm({ ...chatForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Location *</label>
                <input
                  required
                  type="text"
                  value={chatForm.location}
                  onChange={e => setChatForm({ ...chatForm, location: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp"
                  placeholder="e.g. USA, Florida"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Message (Optional)</label>
              <textarea
                value={chatForm.message}
                onChange={e => setChatForm({ ...chatForm, message: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp resize-none"
                placeholder="Describe any issue or question you have..."
              />
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5 uppercase tracking-tight">Support Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={16} />
                <select
                  required
                  value={selectedContact}
                  onChange={e => setSelectedContact(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-secondary border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-whatsapp appearance-none"
                >
                  <option value="">Select a support number...</option>
                  {SUPPORT_CONTACTS.map(c => (
                    <option key={c.number} value={c.number}>{c.label} — {c.number}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
              </div>
            </div>
            <button
              type="submit"
              disabled={!selectedContact}
              className="w-full bg-whatsapp text-white py-3 rounded-xl font-black text-sm hover:bg-green-600 transition-all shadow-lg shadow-whatsapp/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink size={16} />
              Open WhatsApp Chat
            </button>
          </form>
        )}
      </div>

      {/* Existing setup booking form */}
      <div className="grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Users size={32} />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight leading-[1.1]">
            Professional<br />
            <span className="text-indigo-600">Store Setup</span>
          </h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Our experts will help you connect your Meta Business account, setup your first 50 products, and configure your payment gateways.
          </p>

          <div className="space-y-4 pt-6">
            {[
              { icon: ShieldCheck, text: 'Secure configuration', sub: 'Verified Meta integration' },
              { icon: Clock, text: 'Fast turnaround', sub: 'Store live in < 24 hours' },
              { icon: Phone, text: 'Dedicated support', sub: 'Direct line to our engineers' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground/70 font-medium uppercase tracking-tighter">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-card rounded-3xl border border-border p-8 shadow-2xl shadow-gray-100/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Business Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={18} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-secondary border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="alex@store.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">WhatsApp Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={18} />
                    <input
                      required
                      type="tel"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-secondary border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="+254..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight">Business & Setup Details</label>
                <div className="relative">
                  <Info className="absolute left-4 top-4 text-muted-foreground/70" size={18} />
                  <textarea
                    required
                    value={formData.businessInfo}
                    onChange={e => setFormData({ ...formData, businessInfo: e.target.value })}
                    rows={4}
                    className="w-full pl-12 pr-4 py-4 bg-secondary border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                    placeholder="Tell us about your products and any specific requirements you have..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-tight font-sans">Preferred Setup Time</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={18} />
                  <input
                    type="text"
                    value={formData.preferredTime}
                    onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-secondary border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="e.g. Tomorrow Afternoon"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      Request Professional Setup
                      <Send size={20} />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground/70 mt-4 font-bold uppercase tracking-widest">
                  Secure Submission · No commitment required
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

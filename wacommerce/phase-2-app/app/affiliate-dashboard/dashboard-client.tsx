'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle, X, Send } from 'lucide-react'

export default function AffiliateDashboardClient({ 
  targetLink, referralCode 
}: { 
  targetLink: string, referralCode: string 
}) {
  const [copied, setCopied] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([
    { role: 'ai', text: 'Hi! I am your Chatevo Affiliate Assistant. Ask me anything about tracking links, payouts, or how to grow your network.' }
  ])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Fake AI response using exact keyword hooks or generalized response
    const userMsg = message
    setMessage('')
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }])
    
    setTimeout(() => {
      let reply = "I'm currently unable to access your live stats, but keep sharing your link to climb the tiers!"
      if (userMsg.toLowerCase().includes('payout')) reply = "Payouts process once you cross $100. They hit your configured payment method normally in 3-5 days."
      if (userMsg.toLowerCase().includes('link')) reply = `Your link is ${targetLink}. Anyone who registers through it becomes your Tier 1 referral!`
      
      setChatHistory(prev => [...prev, { role: 'ai', text: reply }])
    }, 800)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-mono text-sm overflow-x-auto text-slate-800">
          {targetLink}
        </div>
        <button 
          onClick={copyToClipboard}
          className="bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied' : 'Copy Link'}
        </button>
      </div>

      {/* Floating AI Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200 w-80 sm:w-96 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} />
                <span className="font-bold">Affiliate Assistant</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="hover:opacity-75">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none text-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ask for help..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="submit" disabled={!message.trim()} className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <button 
            onClick={() => setChatOpen(true)}
            className="bg-primary text-white w-16 h-16 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <MessageCircle size={28} />
          </button>
        )}
      </div>
    </>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Minus, Maximize2, Headphones } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AiAssist() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm the **Chatevo Support Teacher** 🧑‍🏫. I can help you set up your store, connect WhatsApp, or explain referrals. Would you like a **Full Guide** or a **Step-by-Step** walkthrough? 🚀" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later. 🧡" }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed md:bottom-6 bottom-4 md:right-6 right-4 bg-[#075E54] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all z-[100] flex items-center gap-2 group border-2 border-white/20"
      >
        <Headphones className="transition-transform group-hover:rotate-12" size={24} />
        <span className="font-bold pr-2 hidden md:block uppercase tracking-widest text-xs">Help & Support</span>
      </button>
    )
  }

  return (
    <div className={`
      fixed md:bottom-6 bottom-0 md:right-6 right-0 md:w-96 w-full bg-white border border-slate-200 shadow-2xl z-[100] overflow-hidden flex flex-col transition-all duration-300 ease-in-out
      ${isMinimized ? 'h-16 md:rounded-2xl rounded-t-2xl' : 'h-[85vh] md:h-[35rem] md:rounded-2xl rounded-t-2xl'}
    `}>
      {/* Header */}
      <div className="bg-[#075E54] p-4 flex items-center justify-between text-white shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl border border-white/10">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-sm tracking-tight uppercase">Support Assistant</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1 opacity-70">
              <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse" />
              Teacher Mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-colors hidden md:block">
            {isMinimized ? <Maximize2 size={18} /> : <Minus size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 relative custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`
                  max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm font-medium
                  ${m.role === 'user' 
                    ? 'bg-[#075E54] text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none prose prose-slate prose-sm max-w-none'
                  }
                `}>
                  {m.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Teacher is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="relative group">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask your teacher anything..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:ring-4 focus:ring-[#075E54]/5 focus:border-[#075E54] outline-none font-bold placeholder-slate-400 pr-12 transition-all"
              />
              <button
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#075E54] hover:bg-[#075E54]/5 rounded-lg transition-colors"
                disabled={!input.trim() || loading}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-3">Powered by Chatevo AI</p>
          </div>
        </>
      )}
    </div>
  )
}

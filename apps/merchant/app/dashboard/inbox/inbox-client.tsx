'use client'

import { useState } from 'react'
import { Send, Bot, User, MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  status: string | null
  is_bot_active: number | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number | null
  contact_name: string | null
  contact_phone: string | null
  contact_tags: string | null
}

interface Message {
  id: string
  content: string | null
  direction: string
  message_type: string | null
  created_at: string | null
  sent_by: string | null
}

export default function InboxClient({
  conversations,
  orgId,
  userId,
}: {
  conversations: Conversation[]
  orgId: string
  userId: string
}) {
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  async function selectConv(conv: Conversation) {
    setSelected(conv)
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?conversation_id=${conv.id}`)
      const data = await res.json() as { data: Message[] }
      setMessages(data.data || [])
    } catch { setMessages([]) }
    finally { setLoading(false) }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return
    setSending(true)
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selected.id,
          contact_id: null,
          content: replyText,
          message_type: 'text',
        }),
      })
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: replyText,
        direction: 'outbound',
        message_type: 'text',
        created_at: new Date().toISOString(),
        sent_by: userId,
      }])
      setReplyText('')
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm h-[calc(100vh-200px)] flex overflow-hidden">
      {/* Conversation List */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border/50">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConv(conv)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary transition-colors ${
                selected?.id === conv.id ? 'bg-green-50 border-r-2 border-r-[#25D366]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {conv.contact_name || conv.contact_phone}
                    </span>
                    {conv.is_bot_active ? (
                      <Bot size={12} className="text-[#25D366] flex-shrink-0" />
                    ) : (
                      <User size={12} className="text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{conv.last_message_preview}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground/70">
                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {(conv.unread_count || 0) > 0 && (
                    <span className="bg-[#25D366] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message Panel */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{selected.contact_name || selected.contact_phone}</p>
              <p className="text-xs text-muted-foreground/70">{selected.contact_phone}</p>
            </div>
            <div className="flex items-center gap-2">
              {selected.is_bot_active ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Bot size={10} /> Bot Active
                </span>
              ) : (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <User size={10} /> Human
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground/70 py-10">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground/70 py-10">No messages yet</div>
            ) : messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                  msg.direction === 'outbound'
                    ? 'bg-[#25D366] text-white rounded-tr-sm'
                    : 'bg-secondary/50 text-foreground rounded-tl-sm'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-green-100' : 'text-muted-foreground/70'}`}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {msg.sent_by && ' · You'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply */}
          <div className="px-5 py-4 border-t border-border flex gap-3">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
              placeholder="Type a message..."
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
              className="bg-[#25D366] text-white p-2.5 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p>Select a conversation to view messages</p>
          </div>
        </div>
      )}
    </div>
  )
}

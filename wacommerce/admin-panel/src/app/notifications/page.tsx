'use client'
import { useState } from 'react'
import { Bell, Send, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { sendNotification } from '../actions/notifications'

export default function NotificationsAdminPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [targetOrgId, setTargetOrgId] = useState('') // empty means bulk broadcast
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await sendNotification({ title, message, type, targetOrgId })
      if (res.success) {
        setStatus('success')
        setTitle('')
        setMessage('')
        setTargetOrgId('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight font-serif flex items-center gap-3">
          <Bell className="text-primary" /> Send Notifications
        </h1>
        <p className="text-slate-500 font-medium mt-2">Broadcast alerts to all users or target a specific organization.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleSend} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Notification Title</label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., New Feature Released!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Type of Alert</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
              >
                <option value="info">Info (Blue)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="error">Error (Red)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Message Body</label>
            <textarea 
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Detail the update or alert here..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-slate-400" /> Target Organization ID (Optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">Leave blank to broadcast to ALL merchants on Sella.</p>
            <input 
              value={targetOrgId}
              onChange={e => setTargetOrgId(e.target.value)}
              placeholder="e.g., org_2Zj8Lp... (Leave blank for Bulk Broadcast)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
            <button 
              type="submit"
              disabled={status === 'sending'}
              className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending...' : (
                <><Send size={18} /> Send Notification</>
              )}
            </button>

            {status === 'success' && (
              <span className="text-emerald-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 size={18} /> Sent successfully!
              </span>
            )}
            
            {status === 'error' && (
              <span className="text-red-500 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle size={18} /> Failed to send.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

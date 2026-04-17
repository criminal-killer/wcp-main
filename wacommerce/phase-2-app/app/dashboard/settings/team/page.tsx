'use client'
import { useState, useEffect } from 'react'
import { Users, UserPlus, Shield, Mail, Trash2, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/settings/team')
      const data = await res.json()
      setMembers(data)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return

    try {
      const res = await fetch('/api/settings/team', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, name: newEmail.split('@')[0], role: 'member' })
      })

      if (res.ok) {
        toast.success('Member added successfully')
        setNewEmail('')
        setIsAdding(false)
        fetchMembers()
      } else {
        const err = await res.text()
        toast.error(err)
      }
    } catch (err) {
      toast.error('Failed to add member')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-whatsapp" /> Team Management
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">
            Add collaborators and manage permissions for your store
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-whatsapp/5 text-whatsapp border-whatsapp/20 font-black px-4 py-1">
                ELITE PLAN
            </Badge>
            <button 
                onClick={() => setIsAdding(true)}
                className="bg-whatsapp text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-whatsapp/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
                <UserPlus size={16} /> Add Member
            </button>
        </div>
      </div>

      {isAdding && (
        <Card className="p-6 rounded-3xl border-2 border-whatsapp/20 bg-whatsapp/5 animate-in zoom-in-95 duration-200">
           <form onSubmit={handleAddMember} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Collaborator's Email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-whatsapp/20 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 md:flex-none bg-whatsapp text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">
                  Send Invite
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all">
                  Cancel
                </button>
              </div>
           </form>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member: any) => (
            <Card key={member.id} className="p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 group-hover:border-whatsapp group-hover:bg-whatsapp/5 transition-all">
                  <span className="font-black text-lg">{member.email[0].toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {member.name || 'Invited User'}
                    {member.role === 'owner' && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black text-[9px] uppercase tracking-widest">
                            Owner
                        </Badge>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="hidden md:flex flex-col text-right">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Joined</span>
                   <span className="text-sm font-bold text-slate-700 italic">
                     {new Date(member.created_at).toLocaleDateString()}
                   </span>
                </div>
                
                {member.role !== 'owner' && (
                    <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 size={20} />
                    </button>
                )}
                {member.role === 'owner' && (
                    <div className="p-3 text-emerald-500">
                        <CheckCircle2 size={20} />
                    </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex items-start gap-4">
         <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <Shield size={20} />
         </div>
         <div>
            <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-1">Elite Features Unlocked</h4>
            <p className="text-sm text-blue-700 leading-relaxed max-w-2xl">
                As an **Elite** merchant, you can add up to 20 team members. Your team can access the dashboard, manage products, and respond to customers in the Inbox.
            </p>
         </div>
      </div>
    </div>
  )
}

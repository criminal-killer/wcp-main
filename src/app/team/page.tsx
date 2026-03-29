'use client'
import { useState } from 'react'
import { ShieldAlert, UserPlus, Search, MoreVertical, Shield, Zap, Target } from 'lucide-react'

// Mock Data for Team - In production this would be fetched from the 'users' table or a dedicated 'admins' table
const mockTeam = [
  { id: '1', name: 'Alfred', email: 'alfred.dev8@gmail.com', role: 'Super Admin', status: 'Active', joined: '2024-01-01' },
  { id: '2', name: 'Sarah Jones', email: 'sarah@sella.io', role: 'Admin', status: 'Active', joined: '2024-03-15' },
  { id: '3', name: 'Kevin Marketer', email: 'kevin@growth.io', role: 'Marketer', status: 'Active', joined: '2024-03-20' },
  { id: '4', name: 'Support Bot', email: 'bot@sella.io', role: 'Support', status: 'Inactive', joined: '2024-02-10' },
]

export default function TeamManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight font-serif flex items-center gap-3">
            <ShieldAlert className="text-primary" /> Team Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage administrative access and roles for the Sella platform. Set custom permissions for members.</p>
        </div>
        
        <button className="bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center gap-2 w-fit">
          <UserPlus size={20} /> Invite Member
        </button>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <Shield size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Admins</h3>
          <p className="text-4xl font-black text-slate-900 mt-2 italic font-serif tracking-tighter">02</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">Full Control Access</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Target size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Marketers</h3>
          <p className="text-4xl font-black text-slate-900 mt-2 italic font-serif tracking-tighter">05</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">Growth & Affiliates</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <Zap size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Support</h3>
          <p className="text-4xl font-black text-slate-900 mt-2 italic font-serif tracking-tighter">01</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">Technical Assistance</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden pb-4">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name or email..."
              className="pl-12 pr-6 py-4 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all transition-colors"
            />
           </div>
           
           <div className="flex items-center gap-3">
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Filters:</span>
             <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">All Members</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role & Permission</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Onboarded</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-rows">
              {mockTeam.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm shadow-inner group-hover:scale-110 transition-transform">
                         {member.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base tracking-tight">{member.name}</p>
                        <p className="text-xs text-slate-500 font-bold tracking-tight">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      member.role === 'Super Admin' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      member.role === 'Admin' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                      member.role === 'Marketer' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {member.role === 'Super Admin' && <Shield size={12} />}
                      {member.role}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className={`inline-block w-2 h-2 rounded-full shadow-sm ${member.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                       <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{member.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">{new Date(member.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {mockTeam.length === 0 && (
          <div className="p-20 text-center text-slate-300">
            <ShieldAlert size={64} className="mx-auto mb-6 opacity-10" />
            <p className="font-black text-lg uppercase tracking-widest">No team members identified.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { support_tickets, users, organizations } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { Shield, Ticket, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default async function AdminPage() {
  const { userId } = await auth()
  
  if (userId !== process.env.ADMIN_USER_ID) {
    redirect('/dashboard')
  }

  const tickets = await db.query.support_tickets.findMany({
    orderBy: [desc(support_tickets.created_at)],
    with: {
      user: true,
      org: true,
    }
  })

  return (
    <div className="min-h-screen bg-secondary p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-indigo-600" size={24} />
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Admin Console</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Support Tickets</h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground/70 uppercase">Total Tickets</p>
              <p className="text-2xl font-black text-foreground">{tickets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-6 py-4 text-xs font-black text-muted-foreground/70 uppercase tracking-widest">User / Org</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground/70 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground/70 uppercase tracking-widest">Subject</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground/70 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-muted-foreground/70 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground/70">
                    <Ticket className="mx-auto mb-4 opacity-10" size={48} />
                    <p className="font-bold">No tickets found</p>
                  </td>
                </tr>
              ) : tickets.map((t) => (
                <tr key={t.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground text-sm">{(t as any).user?.email}</p>
                    <p className="text-xs text-muted-foreground">{(t as any).org?.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground text-sm">{t.subject}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{t.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <Clock size={14} />
                      <span className="text-xs font-bold uppercase tracking-tight">{t.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground/70 font-medium">
                    {new Date(t.created_at!).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

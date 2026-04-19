import { db } from "@/lib/db"
import { support_tickets, users, organizations } from "@/lib/schema"
import { desc, eq } from "drizzle-orm"
import { LifeBuoy, Clock, ArrowRight, ShieldCheck } from "lucide-react"

export default async function TicketsPage() {
  let ticketsList: any[] = []
  
  try {
    ticketsList = await db.select({
      id: support_tickets.id,
      subject: support_tickets.subject,
      description: support_tickets.description,
      status: support_tickets.status,
      type: support_tickets.type,
      created_at: support_tickets.created_at,
      user_name: users.name,
      user_email: users.email,
      org_name: organizations.name
    })
    .from(support_tickets)
    .leftJoin(users, eq(support_tickets.user_id, users.id))
    .leftJoin(organizations, eq(support_tickets.org_id, organizations.id))
    .orderBy(desc(support_tickets.created_at))
    .limit(100)
  } catch (err) {
    console.error("Error fetching tickets:", err)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight flex items-center gap-3">
          <LifeBuoy size={32} className="text-primary not-italic" /> Support Tickets
        </h1>
        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Manage all incoming support requests</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User / Org</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type & Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ticketsList.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-bold text-slate-900">{ticket.user_name || ticket.user_email}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ticket.org_name || 'No Org'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {ticket.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700 border-amber-200' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <p className="text-sm font-bold text-slate-800">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">{ticket.description}</p>
                  </td>
                  <td className="px-6 py-4">
                     <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                       View <ArrowRight size={14} />
                     </button>
                  </td>
                </tr>
              ))}
              {ticketsList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300">
                     <LifeBuoy size={48} className="mx-auto mb-4 opacity-10" />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em]">No tickets found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { db } from '@/db';
import { leads } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { approveLead, rejectLead } from '../actions';
import { Globe, Mail, UserCheck, X } from 'lucide-react';

export default async function LeadsPage() {
  const newLeads = await db.select()
    .from(leads)
    .where(eq(leads.status, 'NEW'))
    .orderBy(desc(leads.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Leads Approval</h1>
        <p className="text-[#a1a1aa] text-sm">Review scraped businesses. Approved leads will be queued for the next batch email.</p>
      </div>

      <div className="grid gap-4">
        {newLeads.length === 0 ? (
          <div className="border border-dashed border-[#27272a] rounded-lg p-12 text-center text-[#a1a1aa]">
            No new leads found. Try running your scraper first.
          </div>
        ) : (
          newLeads.map((lead) => (
            <div key={lead.id} className="bg-[#18181b] border border-[#27272a] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-purple-500/30 transition-all shadow-sm">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{lead.businessName}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {lead.personaType || 'General'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[#71717a]">
                  <div className="flex items-center gap-1">
                    <Globe size={14} className="text-[#3f3f46]" />
                    {lead.website ? <a href={lead.website} className="hover:text-white underline underline-offset-4">{lead.website.replace('https://', '')}</a> : 'No Website'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail size={14} className="text-[#3f3f46]" />
                    {lead.email || 'No Email'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <form action={approveLead.bind(null, lead.id)} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all active:scale-95">
                    <UserCheck size={18} />
                    Approve
                  </button>
                </form>
                <form action={rejectLead.bind(null, lead.id)}>
                   <button className="p-2 border border-[#27272a] hover:bg-red-900/20 text-[#a1a1aa] hover:text-red-400 rounded-lg transition-all active:scale-95">
                      <X size={20} />
                   </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

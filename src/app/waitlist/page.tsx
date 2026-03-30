import { db } from "@/lib/db";
import { waitlist } from "@/lib/schema";
import { count, desc } from "drizzle-orm";
import { Search, Filter, Download, UserCheck, Mail, Database } from "lucide-react";

export default async function WaitlistPage() {
  const allEntries = await db.select().from(waitlist).orderBy(desc(waitlist.created_at));
  const [totalCount] = await db.select({ value: count() }).from(waitlist);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">Waitlist & Leads</h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Manage early adopter migration</p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Download size={16} /> Export CSV
           </button>
           <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-100">
              <UserCheck size={16} /> Migrate All
           </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entries</p>
               <p className="text-2xl font-black text-slate-900 italic font-serif">{totalCount.value}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
               <Database size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beta Interested</p>
               <p className="text-2xl font-black text-slate-900 italic font-serif">42</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
               <UserCheck size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responses</p>
               <p className="text-2xl font-black text-slate-900 italic font-serif">85%</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
               <Mail size={24} />
            </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h2 className="font-bold text-slate-900 italic font-serif">Lead Registry</h2>
           <div className="flex gap-2">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input placeholder="Search leads..." className="pl-9 pr-4 py-1.5 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20" />
              </div>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4">Name / Email</th>
                <th className="p-4">Business Type</th>
                <th className="p-4">Country</th>
                <th className="p-4">Willingness</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-all text-sm font-medium text-slate-600">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{entry.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 italic">{entry.email}</p>
                  </td>
                  <td className="p-4 uppercase text-[10px] font-black tracking-widest text-slate-500">
                    {entry.business_type || 'N/A'}
                  </td>
                  <td className="p-4 text-[10px] font-black tracking-widest text-slate-500">
                    {entry.country || '🌍'}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                       {entry.pricing_willingness || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] font-bold text-slate-300 italic">
                    {new Date(entry.created_at || '').toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-primary hover:text-secondary font-black text-[10px] uppercase tracking-widest">Migrate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

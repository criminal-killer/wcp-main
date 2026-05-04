import { db } from "@/lib/db"
import { audit_logs } from "@/lib/schema"
import { desc } from "drizzle-orm"
import { Activity, Shield, User, Globe, Clock, ChevronRight } from "lucide-react"

export default async function AuditLogsPage() {
  let logs: any[] = []
  try {
    logs = await db.select().from(audit_logs).orderBy(desc(audit_logs.created_at)).limit(100)
  } catch (err) {
    console.error("Error fetching logs:", err)
    // Silently fallback to empty if the table isn't migrated
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight flex items-center gap-3">
            <Activity size={32} className="text-primary not-italic" /> System Activity Logs
          </h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Audit trail for all administrative actions</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Admin</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Target</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Shield size={14} className="text-emerald-500" />
                       <span className="text-sm font-bold text-slate-900">{log.admin_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.target_type}</span>
                       <span className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{log.target_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{log.details || "-"}</p>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300">
                     <Activity size={48} className="mx-auto mb-4 opacity-10" />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em]">No logs found</p>
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

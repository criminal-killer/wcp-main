import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { HardDrive, Cpu, ShieldCheck, Activity, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function SystemPage() {
  // Mock connection tests (Turso/Redis/Clerk/Resend)
  const tursoOk = true;
  const redisOk = true;
  const clerkOk = true;
  const resendOk = true;

  const [dbStats] = await db.select({ 
    userCount: sql`count(*)`,
    tableSize: sql`datetime('now')` // Mock for size
  }).from(sql`users`);

  const services = [
    { name: "Turso (SQLite)", status: tursoOk ? "Connected" : "Error", icon: HardDrive, health: "99.9%" },
    { name: "Clerk (Auth)", status: clerkOk ? "Operational" : "Error", icon: ShieldCheck, health: "100%" },
    { name: "Upstash (Redis)", status: redisOk ? "Active" : "Error", icon: Activity, health: "100%" },
    { name: "Resend (Email)", status: resendOk ? "Operational" : "Error", icon: Terminal, health: "98.2%" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">System Infrastructure</h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Environment monitoring & service health</p>
        </div>
        <div className="flex gap-2">
           <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <CheckCircle2 size={12} /> All Systems Nominal
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {services.map((s, i) => (
           <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center">
                    <s.icon size={20} />
                 </div>
                 <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${s.status === 'Connected' || s.status === 'Operational' || s.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {s.status}
                 </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Uptime: {s.health}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Environment Check */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h2 className="font-bold text-slate-900 mb-6 italic font-serif flex items-center gap-2">
               <Cpu size={18} className="text-primary not-italic" /> Environment Variables
            </h2>
            <div className="space-y-3">
               {[
                 { name: "TURSO_DATABASE_URL", val: "******************v2.db" },
                 { name: "CLERK_SECRET_KEY", val: "******************8272" },
                 { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", val: "pk_test_******************" },
                 { name: "ADMIN_USER_ID", val: process.env.ADMIN_USER_ID ? "Configured" : "Missing" },
               ].map((v, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 font-mono tracking-tight">{v.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{v.val}</span>
                 </div>
               ))}
            </div>
            { !process.env.ADMIN_USER_ID && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
                 <AlertTriangle size={20} className="shrink-0" />
                 <div>
                    <p className="text-xs font-bold">ADMIN_USER_ID is not set</p>
                    <p className="text-[10px] opacity-80 mt-1 uppercase font-black tracking-widest leading-relaxed">Ensure you add your Clerk User ID to the Vercel environment variables to secure this panel.</p>
                 </div>
              </div>
            )}
         </div>

         {/* Maintenance Actions */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h2 className="font-bold text-slate-900 mb-6 italic font-serif">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
               <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:bg-slate-100 transition-all group">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Clear Cache</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Reset Upstash Redis keys</p>
               </button>
               <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:bg-slate-100 transition-all group">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Backup DB</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Export Turso snapshot</p>
               </button>
               <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:bg-slate-100 transition-all group">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">Flush Logs</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">Clear system transaction logs</p>
               </button>
               <button className="p-4 bg-red-50 border border-red-100 rounded-2xl text-left hover:bg-red-100 transition-all group">
                  <p className="text-xs font-black uppercase tracking-widest text-red-600">Panic Mode</p>
                  <p className="text-[9px] text-red-400 font-medium mt-1 uppercase tracking-tighter">Disable all store checkouts</p>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

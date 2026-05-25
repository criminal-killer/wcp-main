import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { HardDrive, Cpu, ShieldCheck, Activity, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import { QuickActions } from "./quick-actions";

async function checkTurso(): Promise<boolean> {
  try {
    await db.select({ val: sql`1` }).from(sql`users`).limit(1);
    return true;
  } catch { return false; }
}

async function checkRedis(): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  try {
    const res = await fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok;
  } catch { return false; }
}

function checkClerk(): boolean {
  return !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

function checkResend(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export default async function SystemPage() {
  const [tursoOk, redisOk] = await Promise.all([checkTurso(), checkRedis()]);
  const clerkOk = checkClerk();
  const resendOk = checkResend();

  const [dbStats] = await db.select({
    userCount: sql`count(*)`,
  }).from(sql`users`);

  const services = [
    { name: "Turso (SQLite)", status: tursoOk ? "Connected" : "Error", icon: HardDrive },
    { name: "Clerk (Auth)", status: clerkOk ? "Operational" : "Error", icon: ShieldCheck },
    { name: "Upstash (Redis)", status: redisOk ? "Active" : "Error", icon: Activity },
    { name: "Resend (Email)", status: resendOk ? "Operational" : "Error", icon: Terminal },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">System Infrastructure</h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Environment monitoring & service health</p>
        </div>
        <div className="flex gap-2">
           {tursoOk && redisOk && clerkOk && resendOk ? (
             <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <CheckCircle2 size={12} /> All Systems Nominal
             </span>
           ) : (
             <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                <AlertTriangle size={12} /> Issues Detected
             </span>
           )}
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{s.status === 'Connected' || s.status === 'Operational' || s.status === 'Active' ? 'Healthy' : 'Check required'}</p>
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
         <QuickActions />
      </div>
    </div>
  );
}

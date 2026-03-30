import { UserButton } from "@clerk/nextjs";
import { Clock, ShieldAlert } from "lucide-react";

export default function WaitingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-amber-500 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight mb-4">
          Pending Approval
        </h1>
        
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Welcome to the **Sella Admin Platform**. Your account has been created successfully, but requires manual authorization by the <span className="font-bold text-slate-900 italic">SuperAdmin (Alfred)</span> before you can access the dashboard.
        </p>
        
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-8 flex items-start gap-3 text-left">
          <ShieldAlert className="text-slate-400 mt-1 shrink-0" size={18} />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
            <p className="text-xs font-bold text-slate-600">Verification in Progress</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sign Out</span>
             <UserButton afterSignOutUrl="/sign-in" />
          </div>
          <p className="text-[10px] text-slate-400 italic">Please check back later once you have been notified of your approval.</p>
        </div>
      </div>
      
      <div className="mt-8 italic font-serif font-black text-2xl text-slate-300 tracking-tighter opacity-50">
        Sella <span className="not-italic font-sans text-[10px] uppercase tracking-widest align-middle ml-1">Admin</span>
      </div>
    </div>
  );
}

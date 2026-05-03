import { ShieldAlert, Home } from "lucide-react";
import Link from "next/link";

export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-100/50">
          <ShieldAlert size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">
            This area is reserved for the <span className="text-primary font-bold italic">Chatevo Platform Owner</span>. 
            Unauthorized access attempts are logged and reported to the security team.
          </p>
        </div>
        <Link href="http://localhost:3000" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all">
          <Home size={18} /> Return to Chatevo
        </Link>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pt-8 border-t border-slate-200">
           Protected by Clerk & Advanced Security Layers
        </p>
      </div>
    </div>
  );
}

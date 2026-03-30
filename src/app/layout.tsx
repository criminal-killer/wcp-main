import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Users, CreditCard, Settings, LifeBuoy, Zap, Bell, ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sella Admin | Platform Management",
  description: "Administrative panel for Sella WhatsApp Commerce",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check for Super Admin Backdoor
  const token = cookies().get('sella_admin_token')?.value;
  let isSuperAdmin = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.SUPER_ADMIN_JWT_SECRET);
      await jwtVerify(token, secret);
      isSuperAdmin = true;
    } catch (e) {}
  }

  // Handle Clerk Auth & Approval
  const user = await currentUser();
  const path = headers().get("x-url") || ""; // Need a way to get path
  // Since we can't easily get path in RSC without help, we'll check status
  
  if (user && !isSuperAdmin) {
    const adminId = process.env.ADMIN_USER_ID;
    
    // 1. If it's the official SuperAdmin ID, bypass
    if (user.id === adminId) {
      isSuperAdmin = true;
    } else {
      // 2. Check Database Status
      let dbUser = await db.query.users.findFirst({
        where: eq(users.clerk_id, user.id)
      });

      // 3. Auto-register if missing
      if (!dbUser) {
        [dbUser] = await db.insert(users).values({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          org_id: "system", // Admin users use 'system' org or similar
          role: "pending",
          is_active: 0,
        }).returning();
      }

      // 4. Redirect if not active (and not already on waiting page)
      if (dbUser.is_active === 0 && !path.includes("/waiting-approval")) {
        return redirect("/waiting-approval");
      }
    }
  }

  const DashboardShell = ({ isSuper }: { isSuper: boolean }) => (
    <div className={`flex min-h-screen ${isSuper ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <aside className={`${isSuper ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'} w-64 border-r flex flex-col fixed h-full z-20`}>
        <div className={`p-6 border-b ${isSuper ? 'border-white/5' : 'border-slate-100'} flex flex-col gap-1`}>
          <div className="italic font-serif font-black text-2xl text-primary tracking-tighter text-nowrap">
            Sella <span className={`${isSuper ? 'text-slate-500' : 'text-slate-400'} not-italic font-sans text-[10px] uppercase tracking-widest align-middle ml-1`}>Admin</span>
          </div>
          {isSuper && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit mt-2">
              <ShieldCheck size={10} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Super Admin</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <LayoutDashboard size={18} /> Overview
          </Link>
          <Link href="/users" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <Users size={18} /> User Management
          </Link>
          <Link href="/revenue" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <CreditCard size={18} /> Revenue
          </Link>
          <Link href="/waitlist" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <Zap size={18} /> Waitlist
          </Link>
          <Link href="/tickets" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <LifeBuoy size={18} /> Support Tickets
          </Link>
          <Link href="/notifications" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <Bell size={18} /> Notifications
          </Link>
          <Link href="/affiliates" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <ShieldCheck size={18} /> Affiliates
          </Link>
          <Link href="/team" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
            <ShieldAlert size={18} /> Team
          </Link>
          {isSuper && (
            <Link href="/system/logs" className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${isSuper ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} rounded-xl transition-all`}>
              <Activity size={18} /> Audit Logs
            </Link>
          )}
        </nav>

        <div className={`p-4 border-t ${isSuper ? 'border-white/5' : 'border-slate-100'} flex items-center justify-between`}>
          {isSuper ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-lg shadow-emerald-500/20">A</div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">Alfred</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Backdoor Active</p>
              </div>
            </div>
          ) : <UserButton afterSignOutUrl="/" />}
          <Link href="/system" className={`p-2 ${isSuper ? 'text-slate-500 hover:text-emerald-500' : 'text-slate-400 hover:text-primary'} transition-all`}>
            <Settings size={20} />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {isSuperAdmin ? (
            <DashboardShell isSuper={true} />
          ) : (
            <>
              <SignedOut>
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-8">
                  <div className="italic font-serif font-black text-6xl text-primary tracking-tighter">Sella</div>
                  <SignInButton mode="modal">
                    <button className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
                      Platform Login
                    </button>
                  </SignInButton>
                  <Link href="/auth/super-login" className="text-xs font-black text-slate-400 hover:text-primary transition-colors tracking-[0.3em] uppercase py-4">
                    Backdoor Entry
                  </Link>
                </div>
              </SignedOut>
              <SignedIn>
                <DashboardShell isSuper={false} />
              </SignedIn>
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}

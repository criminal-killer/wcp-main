import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Users, CreditCard, Settings, LifeBuoy, Zap } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sella Admin | Platform Management",
  description: "Administrative panel for Sella WhatsApp Commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <SignedOut>
             <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <SignInButton mode="modal">
                   <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all">
                      Admin Login
                   </button>
                </SignInButton>
             </div>
          </SignedOut>
          <SignedIn>
            <div className="flex min-h-screen bg-slate-50">
              {/* Sidebar */}
              <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-100 italic font-serif font-black text-2xl text-primary tracking-tighter">
                  Sella <span className="text-slate-400 not-italic font-sans text-[10px] uppercase tracking-widest align-middle ml-1">Admin</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                  <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <LayoutDashboard size={18} /> Overview
                  </Link>
                  <Link href="/users" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <Users size={18} /> User Management
                  </Link>
                  <Link href="/revenue" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <CreditCard size={18} /> Revenue
                  </Link>
                  <Link href="/waitlist" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <Zap size={18} /> Waitlist
                  </Link>
                  <Link href="/tickets" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <LifeBuoy size={18} /> Support Tickets
                  </Link>
                </nav>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                  <UserButton afterSignOutUrl="/" />
                  <Link href="/system" className="p-2 text-slate-400 hover:text-primary transition-all">
                    <Settings size={20} />
                  </Link>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 ml-64 p-8">
                {children}
              </main>
            </div>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}

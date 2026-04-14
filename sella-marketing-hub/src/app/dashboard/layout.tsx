import Link from 'next/link';
import { LayoutDashboard, FileText, Users, BarChart3, LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function handleLogout() {
    'use server';
    await logout();
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#27272a] p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="px-3 py-4">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center text-xs">S</span>
              Marketing Hub
            </h1>
          </div>
          
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#18181b] group transition-colors">
              <LayoutDashboard size={18} className="text-[#a1a1aa] group-hover:text-white" />
              Overview
            </Link>
            <Link href="/dashboard/posts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#18181b] group transition-colors">
              <FileText size={18} className="text-[#a1a1aa] group-hover:text-white" />
              Posts Approval
            </Link>
            <Link href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#18181b] group transition-colors">
              <Users size={18} className="text-[#a1a1aa] group-hover:text-white" />
              Leads Approval
            </Link>
            <Link href="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#18181b] group transition-colors">
              <BarChart3 size={18} className="text-[#a1a1aa] group-hover:text-white" />
              Analytics
            </Link>
          </nav>
        </div>
        
        <form action={handleLogout}>
          <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-red-900/20 text-red-400 group transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

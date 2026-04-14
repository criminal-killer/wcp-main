import { db } from '@/db';
import { marketingPosts, leads, analytics } from '@/db/schema';
import { count, eq, and, gt } from 'drizzle-orm';
import { FileText, Users, Zap, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const [postCount] = await db.select({ value: count() }).from(marketingPosts).where(eq(marketingPosts.status, 'PENDING'));
  const [leadCount] = await db.select({ value: count() }).from(leads).where(eq(leads.status, 'NEW'));
  const [scheduledCount] = await db.select({ value: count() }).from(marketingPosts).where(eq(marketingPosts.status, 'APPROVED'));

  const stats = [
    { name: 'Pending Posts', value: postCount.value, icon: FileText, color: 'text-purple-400' },
    { name: 'New Leads', value: leadCount.value, icon: Users, iconColor: 'text-blue-400' },
    { name: 'Scheduled for Tomorrow', value: scheduledCount.value, icon: Zap, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Growth Command Center</h1>
        <p className="text-[#a1a1aa] mt-2">Welcome back, Admin. Here's your marketing snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-sm hover:border-[#3f3f46] transition-colors group cursor-default">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-[#09090b] border border-[#27272a] group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <TrendingUp size={16} className="text-[#3f3f46]" />
            </div>
            <p className="text-sm font-medium text-[#a1a1aa]">{stat.name}</p>
            <p className="text-4xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center border border-purple-500/20">
             <Zap size={32} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">Automation Status: All Systems Go</h3>
          <p className="text-[#a1a1aa] text-sm max-w-xs">Your daily AI scripts and scrapers are syncing with Turso. Click below to view detailed analytics.</p>
          <button className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-all">
            View Reports
          </button>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 space-y-6">
           <h3 className="text-lg font-bold">Upcoming Batch</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#09090b] rounded-lg border border-[#27272a]">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Tomorrow's Fixed Posting</span>
                 </div>
                 <span className="text-xs text-[#a1a1aa]">09:00 AM Local</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#09090b] rounded-lg border border-[#27272a]">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Auto-Janitor Cleanup</span>
                 </div>
                 <span className="text-xs text-[#a1a1aa]">Every 24h</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

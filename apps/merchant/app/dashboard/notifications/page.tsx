import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, notifications } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Bell, AlertCircle, Info, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

export default async function NotificationsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  // Mark all as read
  await db.update(notifications)
    .set({ is_read: 1 })
    .where(and(eq(notifications.org_id, user.org_id!), eq(notifications.is_read, 0)))

  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.org_id, user.org_id),
    orderBy: [desc(notifications.created_at)],
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight font-serif">Notifications</h1>
          <p className="text-muted-foreground font-medium mt-1">Updates and alerts for your Chatevo store.</p>
        </div>
        <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shadow-inner">
          <Bell size={24} className="text-primary" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {userNotifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bell size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold text-lg">You're all caught up!</p>
            <p className="text-sm">No new notifications at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {userNotifications.map((notif) => (
              <div key={notif.id} className="p-6 flex gap-4 hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {notif.type === 'success' && <CheckCircle2 size={24} className="text-[#25D366]" />}
                  {notif.type === 'warning' && <AlertTriangle size={24} className="text-amber-500" />}
                  {notif.type === 'error' && <AlertCircle size={24} className="text-red-500" />}
                  {notif.type === 'info' && <Info size={24} className="text-blue-500" />}
                  {!['success', 'warning', 'error', 'info'].includes(notif.type || '') && (
                    <Bell size={24} className="text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{notif.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground/50 whitespace-nowrap">
                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>

                  {notif.action_url && (
                    <div className="mt-4">
                      <Link
                        href={notif.action_url}
                        className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors"
                      >
                        View Details <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

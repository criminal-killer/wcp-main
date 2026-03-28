import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, conversations, contacts, organizations } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { MessageSquare } from 'lucide-react'
import InboxClient from './inbox-client'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const convList = await db.select({
    id: conversations.id,
    status: conversations.status,
    is_bot_active: conversations.is_bot_active,
    last_message_at: conversations.last_message_at,
    last_message_preview: conversations.last_message_preview,
    unread_count: conversations.unread_count,
    contact_name: contacts.name,
    contact_phone: contacts.phone,
    contact_tags: contacts.tags,
  })
    .from(conversations)
    .leftJoin(contacts, eq(conversations.contact_id, contacts.id))
    .where(eq(conversations.org_id, user.org_id))
    .orderBy(desc(conversations.last_message_at))
    .limit(50)

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Inbox</h1>
          <p className="text-gray-500 mt-1">{convList.length} conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      {convList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">No conversations yet</h3>
          <p className="text-gray-400">When customers message your WhatsApp store, conversations will appear here.</p>
        </div>
      ) : (
        <InboxClient conversations={convList} orgId={user.org_id} userId={user.id} />
      )}
    </div>
  )
}

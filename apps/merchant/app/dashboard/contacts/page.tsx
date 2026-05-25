import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, contacts, organizations } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { Users, Download } from 'lucide-react'
import ContactsTable from './contacts-table'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })

  const contactList = await db.select()
    .from(contacts)
    .where(eq(contacts.org_id, user.org_id))
    .orderBy(desc(contacts.created_at))
    .limit(200)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">{contactList.length} contacts · 1,000 limit</p>
        </div>
        <a
          href="/api/contacts/export"
          className="flex items-center gap-2 bg-card border border-border text-muted-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-colors"
        >
          <Download size={16} />
          Export CSV
        </a>
      </div>

      {contactList.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <Users size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-bold text-muted-foreground text-lg mb-2">No contacts yet</h3>
          <p className="text-muted-foreground/70">Contacts are automatically saved when customers message your WhatsApp store.</p>
        </div>
      ) : (
        <ContactsTable contacts={contactList} currency={org?.currency || 'USD'} />
      )}
    </div>
  )
}

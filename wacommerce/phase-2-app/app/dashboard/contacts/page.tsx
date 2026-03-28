import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, contacts } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { Users, Download } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) redirect('/onboarding')

  const contactList = await db.select()
    .from(contacts)
    .where(eq(contacts.org_id, user.org_id))
    .orderBy(desc(contacts.created_at))
    .limit(200)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Contacts</h1>
          <p className="text-gray-500 mt-1">{contactList.length} contacts · 1,000 limit</p>
        </div>
        <a
          href="/api/contacts/export"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </a>
      </div>

      {contactList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Users size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">No contacts yet</h3>
          <p className="text-gray-400">Contacts are automatically saved when customers message your WhatsApp store.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex gap-3">
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Orders</th>
                <th className="text-left px-5 py-3">Total Spent</th>
                <th className="text-left px-5 py-3">Tags</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contactList.map((contact) => {
                const tags = JSON.parse(contact.tags || '[]') as string[]
                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#25D366] font-bold text-sm">
                            {(contact.name || contact.phone || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{contact.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{contact.phone}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{contact.total_orders || 0}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {(contact.total_spent || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {tags.map((tag) => (
                          <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/dashboard/contacts/${contact.id}`} className="text-sm text-[#25D366] font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

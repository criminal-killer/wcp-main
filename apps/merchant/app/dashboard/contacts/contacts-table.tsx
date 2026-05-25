'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Contact {
  id: string
  name: string | null
  phone: string
  email: string | null
  tags: string | null
  total_orders: number | null
  total_spent: number | null
  created_at: string | null
}

export default function ContactsTable({ contacts, currency }: { contacts: Contact[]; currency: string }) {
  const [search, setSearch] = useState('')

  const filtered = contacts.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(q) ||
      c.phone.includes(search) ||
      (c.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex gap-3">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
        />
      </div>
      <table className="w-full">
        <thead className="bg-secondary border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                {search ? 'No contacts match your search' : 'No contacts yet'}
              </td>
            </tr>
          ) : (
            filtered.map((contact) => {
              const tags = JSON.parse(contact.tags || '[]') as string[]
              return (
                <tr key={contact.id} className="hover:bg-secondary transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#25D366] font-bold text-sm">
                          {(contact.name || contact.phone || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">{contact.name || 'Unknown'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{contact.phone}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{contact.total_orders || 0}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">
                    {currency} {(contact.total_spent || 0).toLocaleString()}
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
                  <td className="px-5 py-3 text-sm text-muted-foreground/70">
                    {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/dashboard/contacts/${contact.id}`} className="text-sm text-[#25D366] font-medium hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

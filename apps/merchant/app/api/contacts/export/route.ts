import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, contacts } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// ============================================
// GET /api/contacts/export — Stream contacts as a CSV file
// ============================================
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const allContacts = await db.query.contacts.findMany({
    where: eq(contacts.org_id, user.org_id),
  })

  const headers = ['id', 'phone', 'name', 'email', 'language', 'tags', 'total_orders', 'total_spent', 'loyalty_points', 'last_order_at', 'created_at']

  const csvRows = [
    headers.join(','),
    ...allContacts.map(c =>
      headers.map(h => {
        const val = (c as Record<string, unknown>)[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        // Escape commas/quotes per RFC 4180
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ),
  ]

  const csv = csvRows.join('\r\n')
  const filename = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

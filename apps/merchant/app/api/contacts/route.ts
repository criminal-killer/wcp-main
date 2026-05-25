export const dynamic = "force-dynamic"

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, contacts } from '@/lib/schema'
import { eq, and, desc, like, or } from 'drizzle-orm'
import { logError, categorizeError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    const conditions = [eq(contacts.org_id, user.org_id)]

    if (search) {
      const pattern = `%${search}%`
      conditions.push(or(
        like(contacts.name, pattern),
        like(contacts.phone, pattern),
        like(contacts.email, pattern)
      )!)
    }

    let list = await db.select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.created_at))
      .limit(1000)

    if (tag) {
      list = list.filter(c => {
        const tags = JSON.parse(c.tags || '[]') as string[]
        return tags.includes(tag)
      })
    }

    return NextResponse.json({ data: list, total: list.length })
  } catch (error) {
    console.error('[contacts]', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { encrypt } from '@/lib/encryption'

// Store Info
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { name?: string; description?: string; theme_color?: string; currency?: string }
  const update: Partial<typeof organizations.$inferInsert> = { updated_at: new Date().toISOString() }
  if (body.name) update.name = body.name
  if (body.description !== undefined) update.description = body.description
  if (body.theme_color) update.theme_color = body.theme_color
  if (body.currency) update.currency = body.currency

  const [org] = await db.update(organizations).set(update).where(eq(organizations.id, user.org_id)).returning()
  return NextResponse.json({ data: org, message: 'Store settings updated' })
}

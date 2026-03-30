import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify Super Admin
  const user = await db.query.users.findFirst({
    where: and(eq(users.clerk_id, userId), eq(users.is_super_admin, 1))
  })

  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { orgIds } = await req.json() as { orgIds: string[] }
    if (!orgIds || orgIds.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    // Update all selected orgs to is_waitlisted = 0
    await db.update(organizations)
      .set({ is_waitlisted: 0 })
      .where(inArray(organizations.id, orgIds))

    return NextResponse.json({ success: true, message: `${orgIds.length} organizations onboarded.` })
  } catch (error) {
    console.error('Bulk onboard error:', error)
    return NextResponse.json({ error: 'Failed to onboard organizations' }, { status: 500 })
  }
}

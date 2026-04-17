import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { userId, orgId } = auth()
  if (!userId || !orgId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const orgUsers = await db
      .select()
      .from(users)
      .where(eq(users.org_id, orgId))

    return NextResponse.json(orgUsers)
  } catch (error) {
    console.error('[TEAM_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId, orgId } = auth()
  if (!userId || !orgId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    })

    if (!org || org.plan !== 'elite') {
      return new NextResponse('This feature is only available on the Elite plan', { status: 403 })
    }

    const { email, name, role } = await req.json()

    // In a real system, we'd use Clerk to invite the user.
    // For this demo, we'll just record the intention in the DB
    // or simulate adding them.
    
    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existing) {
       // Update their org_id and role
       await db.update(users)
         .set({ org_id: orgId, role: role || 'member' })
         .where(eq(users.id, existing.id))
       return NextResponse.json(existing)
    }

    // Create a shadow user record (Clerk will handle auth later)
    const newUser = await db.insert(users).values({
      clerk_id: `invited_${Math.random().toString(36).substring(7)}`,
      org_id: orgId,
      email,
      name,
      role: role || 'member',
    }).returning()

    return NextResponse.json(newUser[0])
  } catch (error) {
    console.error('[TEAM_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

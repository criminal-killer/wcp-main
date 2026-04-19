import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { encrypt } from '@/lib/encryption'

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { phone_number_id?: string; access_token?: string }
  const update: Partial<typeof organizations.$inferInsert> = { updated_at: new Date().toISOString() }

  if (body.phone_number_id) {
    // Check if another organization is already using this phone number id
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.wa_phone_number_id, body.phone_number_id)
    })
    
    if (existingOrg && existingOrg.id !== user.org_id) {
      return NextResponse.json({ error: 'This WhatsApp Phone ID is already registered to another store.' }, { status: 400 })
    }

    update.wa_phone_number_id = body.phone_number_id
  }
  if (body.access_token) update.wa_access_token_encrypted = encrypt(body.access_token)
  // Reset webhook verification when credentials change
  if (body.phone_number_id || body.access_token) update.wa_webhook_verified = 0

  const [org] = await db.update(organizations).set(update).where(eq(organizations.id, user.org_id)).returning()
  return NextResponse.json({ data: { phone_number_id: org.wa_phone_number_id, verified: org.wa_webhook_verified }, message: 'WhatsApp settings saved' })
}

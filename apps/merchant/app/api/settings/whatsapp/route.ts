export const dynamic = "force-dynamic"

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

  const body = await req.json() as {
    phone_number_id?: string
    access_token?: string
    wa_bot_number?: string
    wa_business_account_id?: string
    notification_preference?: string
    notification_phone?: string
  }
  const update: Partial<typeof organizations.$inferInsert> = { updated_at: new Date().toISOString() }

  if (body.phone_number_id) update.wa_phone_number_id = body.phone_number_id
  if (body.access_token) update.wa_access_token_encrypted = encrypt(body.access_token)
  if (body.wa_bot_number !== undefined) update.wa_bot_number = body.wa_bot_number
  if (body.wa_business_account_id !== undefined) update.wa_business_account_id = body.wa_business_account_id
  if (body.notification_preference !== undefined) update.notification_preference = body.notification_preference
  if (body.notification_phone !== undefined) update.notification_phone = body.notification_phone
  if (body.phone_number_id || body.access_token) update.wa_webhook_verified = 0

  const [org] = await db.update(organizations).set(update).where(eq(organizations.id, user.org_id)).returning()
  return NextResponse.json({
    data: {
      phone_number_id: org.wa_phone_number_id,
      wa_bot_number: org.wa_bot_number,
      verified: org.wa_webhook_verified,
      wa_business_account_id: org.wa_business_account_id,
      notification_preference: org.notification_preference,
      notification_phone: org.notification_phone,
    },
    message: 'WhatsApp settings saved'
  })
}

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
    meta_business_id?: string
    wa_catalog_id?: string
    wa_business_account_id?: string
    wa_bot_number?: string
  }
  const update: Partial<typeof organizations.$inferInsert> = { updated_at: new Date().toISOString() }

  if (body.phone_number_id) update.wa_phone_number_id = body.phone_number_id
  if (body.access_token) update.wa_access_token_encrypted = encrypt(body.access_token)
  if (body.meta_business_id !== undefined) update.meta_business_id = body.meta_business_id
  if (body.wa_catalog_id !== undefined) update.wa_catalog_id = body.wa_catalog_id
  if (body.wa_business_account_id !== undefined) update.wa_business_account_id = body.wa_business_account_id
  if (body.wa_bot_number !== undefined) update.wa_bot_number = body.wa_bot_number
  // Reset webhook verification when credentials change
  if (body.phone_number_id || body.access_token) update.wa_webhook_verified = 0

  const [org] = await db.update(organizations).set(update).where(eq(organizations.id, user.org_id)).returning()
  return NextResponse.json({
    data: {
      phone_number_id: org.wa_phone_number_id,
      verified: org.wa_webhook_verified,
      meta_business_id: org.meta_business_id,
      wa_catalog_id: org.wa_catalog_id,
      wa_business_account_id: org.wa_business_account_id,
    },
    message: 'WhatsApp settings saved'
  })
}

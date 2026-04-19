import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { test_phone: string }
  if (!body.test_phone) return NextResponse.json({ error: 'Test phone number is required' }, { status: 400 })

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
  if (!org || !org.wa_phone_number_id || !org.wa_access_token_encrypted) {
    return NextResponse.json({ error: 'WhatsApp credentials not configured' }, { status: 400 })
  }

  const accessToken = decrypt(org.wa_access_token_encrypted)
  
  const result = await sendTextMessage(
    { phoneNumberId: org.wa_phone_number_id, accessToken },
    { to: body.test_phone, body: '🚀 Chatevo: WhatsApp Connection Verified! Your bot is now ready to sell.' }
  )

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // If successful, we can mark the WA credentials as verified
  await db.update(organizations).set({ wa_webhook_verified: 1 }).where(eq(organizations.id, org.id))

  return NextResponse.json({ success: true, message: 'Test message sent and connection verified!' })
}


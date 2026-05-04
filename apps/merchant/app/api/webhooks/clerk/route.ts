import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string; id: string }>
    first_name?: string
    last_name?: string
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const svixId = req.headers.get('svix-id') || ''
  const svixTimestamp = req.headers.get('svix-timestamp') || ''
  const svixSignature = req.headers.get('svix-signature') || ''

  const body = await req.text()
  const wh = new Webhook(webhookSecret)

  let event: ClerkWebhookEvent
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { type, data } = event

  switch (type) {
    case 'user.created':
    case 'user.updated': {
      const email = data.email_addresses?.[0]?.email_address || ''
      // Update email on user if they exist (created during onboarding)
      const existing = await db.query.users.findFirst({ where: eq(users.clerk_id, data.id) })
      if (existing) {
        await db.update(users).set({
          email,
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
        }).where(eq(users.clerk_id, data.id))
      }
      break
    }

    case 'user.deleted': {
      const existing = await db.query.users.findFirst({ where: eq(users.clerk_id, data.id) })
      if (existing) {
        await db.update(users).set({ is_active: 0 }).where(eq(users.clerk_id, data.id))
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

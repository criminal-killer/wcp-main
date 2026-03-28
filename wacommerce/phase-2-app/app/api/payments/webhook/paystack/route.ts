import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, subscriptions } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { verifyPaystackSignature } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') || ''

  const secret = process.env.PAYSTACK_SECRET_KEY || ''
  if (!verifyPaystackSignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body) as {
    event: string
    data: {
      reference: string
      status: string
      amount: number
      currency: string
      customer: { email: string }
      metadata: { org_id?: string; user_id?: string; plan?: string }
      subscription_code?: string
      next_payment_date?: string
    }
  }

  const { data } = event

  switch (event.event) {
    case 'charge.success': {
      const orgId = data.metadata?.org_id
      if (!orgId) break

      const plan = data.metadata?.plan || 'starter'
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // Update org plan
      await db.update(organizations)
        .set({ plan, updated_at: new Date().toISOString() })
        .where(eq(organizations.id, orgId))

      // Upsert subscription
      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.org_id, orgId),
      })

      if (existing) {
        await db.update(subscriptions).set({
          status: 'active',
          plan,
          currency: data.currency,
          amount: data.amount / 100,
          paystack_subscription_code: data.subscription_code,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }).where(eq(subscriptions.org_id, orgId))
      } else {
        await db.insert(subscriptions).values({
          org_id: orgId,
          plan,
          status: 'active',
          provider: 'paystack',
          amount: data.amount / 100,
          currency: data.currency,
          paystack_subscription_code: data.subscription_code || null,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
        })
      }
      break
    }

    case 'subscription.disable':
    case 'subscription.not_renew': {
      const orgId = data.metadata?.org_id
      if (!orgId) break
      await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.org_id, orgId))
      await db.update(organizations).set({ plan: 'free' }).where(eq(organizations.id, orgId))
      break
    }
  }

  return NextResponse.json({ received: true })
}

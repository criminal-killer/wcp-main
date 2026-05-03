import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, subscriptions } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''

  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.org_id
      const plan = session.metadata?.plan || 'starter'
      if (!orgId) break

      await db.update(organizations).set({ plan, updated_at: new Date().toISOString() }).where(eq(organizations.id, orgId))

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const periodEnd = new Date((sub.current_period_end) * 1000).toISOString()
      const periodStart = new Date((sub.current_period_start) * 1000).toISOString()

      const existing = await db.query.subscriptions.findFirst({ where: eq(subscriptions.org_id, orgId) })
      if (existing) {
        await db.update(subscriptions).set({
          status: 'active', plan,
          stripe_subscription_id: sub.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }).where(eq(subscriptions.org_id, orgId))
      } else {
        await db.insert(subscriptions).values({
          org_id: orgId, plan, status: 'active', provider: 'stripe',
          stripe_subscription_id: sub.id,
          amount: (sub.items.data[0].price.unit_amount || 2900) / 100,
          currency: sub.currency.toUpperCase(),
          current_period_start: periodStart,
          current_period_end: periodEnd,
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.org_id
      if (!orgId) break
      await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.org_id, orgId))
      await db.update(organizations).set({ plan: 'free' }).where(eq(organizations.id, orgId))
      break
    }
  }

  return NextResponse.json({ received: true })
}

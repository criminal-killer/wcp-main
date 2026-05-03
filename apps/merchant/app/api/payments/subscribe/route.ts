import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
  createPaystackSubscriptionCheckout,
  createStripeSubscriptionCheckout,
  normalizePlan,
  isValidPlan,
} from '@/lib/payments'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const body = await req.json() as { plan: string; provider: 'paystack' | 'stripe'; email?: string }
  const { plan: rawPlan, provider } = body

  // Normalize and validate plan (handles legacy 'growth'/'premium' names too)
  const plan = normalizePlan(rawPlan || 'starter')
  if (!isValidPlan(plan)) {
    return NextResponse.json({ error: 'Invalid plan. Choose starter, pro, or elite.' }, { status: 400 })
  }

  if (provider !== 'paystack' && provider !== 'stripe') {
    return NextResponse.json({ error: 'Invalid provider. Choose paystack or stripe.' }, { status: 400 })
  }

  const email = user.email || body.email
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  try {
    if (provider === 'paystack') {
      const authUrl = await createPaystackSubscriptionCheckout(email, org.id, plan)
      if (!authUrl) return NextResponse.json({ error: 'Paystack checkout failed. Ensure PAYSTACK_SECRET_KEY is configured.' }, { status: 500 })
      return NextResponse.json({ checkout_url: authUrl })
    }

    if (provider === 'stripe') {
      const checkoutUrl = await createStripeSubscriptionCheckout(email, org.id, plan)
      if (!checkoutUrl) return NextResponse.json({ error: 'Stripe checkout failed. Ensure STRIPE_SECRET_KEY is configured.' }, { status: 500 })
      return NextResponse.json({ checkout_url: checkoutUrl })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[subscribe] Checkout error:', message)
    return NextResponse.json({ error: `Checkout failed: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
  createPaystackSubscriptionCheckout,
  createPayPalSubscriptionCheckout,
} from '@/lib/payments'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const body = await req.json() as { plan: string; provider: 'paystack' | 'paypal'; email?: string }
  const { plan = 'starter', provider } = body

  const email = user.email || body.email
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const validPlan = (plan === 'starter' || plan === 'growth' || plan === 'premium') ? plan : 'starter'

  if (provider === 'paystack') {
    const authUrl = await createPaystackSubscriptionCheckout(email, org.id, validPlan)
    if (!authUrl) return NextResponse.json({ error: 'Paystack checkout failed' }, { status: 500 })
    return NextResponse.json({ checkout_url: authUrl })
  }

  if (provider === 'paypal') {
    const checkoutUrl = await createPayPalSubscriptionCheckout(email, org.id, validPlan)
    if (!checkoutUrl) return NextResponse.json({ error: 'PayPal checkout failed' }, { status: 500 })
    return NextResponse.json({ checkout_url: checkoutUrl })
  }

  return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
}

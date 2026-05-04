import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, subscriptions, referrals, affiliates, payments_log } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import Stripe from 'stripe'
import { normalizePlan } from '@/lib/payments'

const REFERRAL_GOAL = 10
const FIRST_COMMISSION_RATE = 0.40
const RECURRING_COMMISSION_RATE = 0.10

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
      if (!orgId) break

      // ── IDEMPOTENCY ───────────────────────────────────────────────────
      const idempotencyKey = `stripe:${event.id}`
      const already = await db.query.payments_log.findFirst({
        where: eq(payments_log.idempotency_key, idempotencyKey),
      })
      if (already) {
        console.log(`[webhook/stripe] Duplicate event ${idempotencyKey} — skipping`)
        break
      }

      const plan = normalizePlan(session.metadata?.plan || 'starter')
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const amountUsd = (sub.items.data[0].price.unit_amount || 2900) / 100
      const periodStart = new Date(sub.current_period_start * 1000).toISOString()
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

      // ── UPDATE ORG PLAN ───────────────────────────────────────────────
      await db.update(organizations)
        .set({ plan, updated_at: new Date().toISOString() })
        .where(eq(organizations.id, orgId))

      // ── UPSERT SUBSCRIPTION ───────────────────────────────────────────
      const existingSub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.org_id, orgId) })
      if (existingSub) {
        await db.update(subscriptions).set({
          status: 'active', plan, stripe_subscription_id: sub.id,
          current_period_start: periodStart, current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }).where(eq(subscriptions.org_id, orgId))
      } else {
        await db.insert(subscriptions).values({
          org_id: orgId, plan, status: 'active', provider: 'stripe',
          stripe_subscription_id: sub.id, amount: amountUsd,
          currency: sub.currency.toUpperCase(),
          current_period_start: periodStart, current_period_end: periodEnd,
        })
      }

      // ── LOG PAYMENT ───────────────────────────────────────────────────
      await db.insert(payments_log).values({
        org_id: orgId,
        type: 'saas_subscription',
        provider: 'stripe',
        provider_reference: event.id,
        amount: amountUsd,
        currency: sub.currency.toUpperCase(),
        status: 'success',
        idempotency_key: idempotencyKey,
        metadata: JSON.stringify(session.metadata),
      })

      // ── AFFILIATE COMMISSION LOGIC ────────────────────────────────────
      await handleReferralCommission(orgId, amountUsd, event.id)
      break
    }

    case 'invoice.payment_succeeded': {
      // Recurring subscription renewal
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string | null
      if (!subId) break

      const idempotencyKey = `stripe:${event.id}`
      const already = await db.query.payments_log.findFirst({
        where: eq(payments_log.idempotency_key, idempotencyKey),
      })
      if (already) break

      // Find org by stripe subscription id
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripe_subscription_id, subId),
      })
      if (!sub) break

      const amountUsd = (invoice.amount_paid) / 100

      await db.insert(payments_log).values({
        org_id: sub.org_id,
        type: 'saas_renewal',
        provider: 'stripe',
        provider_reference: event.id,
        amount: amountUsd,
        currency: (invoice.currency || 'usd').toUpperCase(),
        status: 'success',
        idempotency_key: idempotencyKey,
      })

      await handleReferralCommission(sub.org_id, amountUsd, event.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.org_id
      if (!orgId) break
      await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.org_id, orgId))
      await db.update(organizations).set({ plan: 'free', updated_at: new Date().toISOString() }).where(eq(organizations.id, orgId))
      break
    }
  }

  return NextResponse.json({ received: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared commission logic (same for Paystack + Stripe)
// ─────────────────────────────────────────────────────────────────────────────
async function handleReferralCommission(orgId: string, amountUsd: number, paymentRef: string) {
  const orgRecord = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  })
  if (!orgRecord?.referred_by) return

  // ── AFFILIATE COMMISSION ──────────────────────────────────────────────────
  const affiliate = await db.query.affiliates.findFirst({
    where: and(
      eq(affiliates.referral_code, orgRecord.referred_by),
      eq(affiliates.status, 'approved'),
    ),
  })

  if (affiliate) {
    const priorCommission = await db.query.referrals.findFirst({
      where: and(
        eq(referrals.referral_code, affiliate.referral_code),
        eq(referrals.referred_org_id, orgId),
        eq(referrals.status, 'paid'),
      ),
    })

    const isFirst = !priorCommission
    const rate = isFirst ? FIRST_COMMISSION_RATE : RECURRING_COMMISSION_RATE
    const commission = Math.round(amountUsd * rate * 100) / 100

    await db.insert(referrals).values({
      referrer_org_id: affiliate.id,
      referred_org_id: orgId,
      referral_code: affiliate.referral_code,
      status: 'paid',
      reward_type: isFirst ? 'affiliate_first' : 'affiliate_recurring',
      reward_amount: commission,
      is_first_payment: isFirst ? 1 : 0,
      payment_ref: paymentRef,
    })

    await db.update(affiliates).set({
      balance: sql`${affiliates.balance} + ${commission}`,
      total_earned: sql`${affiliates.total_earned} + ${commission}`,
      total_referred: isFirst
        ? sql`${affiliates.total_referred} + 1`
        : affiliates.total_referred,
      updated_at: new Date().toISOString(),
    }).where(eq(affiliates.id, affiliate.id))

    console.log(`[webhook/stripe] Credited $${commission} (${isFirst ? '40%' : '10%'}) to affiliate ${affiliate.email}`)
  }

  // ── MERCHANT REFERRAL TRACKING ────────────────────────────────────────────
  const referrerOrg = await db.query.organizations.findFirst({
    where: eq(organizations.referral_code, orgRecord.referred_by),
  })

  if (referrerOrg) {
    const alreadyCounted = await db.query.referrals.findFirst({
      where: and(
        eq(referrals.referral_code, referrerOrg.referral_code!),
        eq(referrals.referred_org_id, orgId),
        eq(referrals.reward_type, 'merchant_referral'),
      ),
    })

    if (!alreadyCounted) {
      await db.insert(referrals).values({
        referrer_org_id: referrerOrg.id,
        referred_org_id: orgId,
        referral_code: referrerOrg.referral_code!,
        status: 'paid',
        reward_type: 'merchant_referral',
        reward_amount: 0,
        is_first_payment: 1,
        payment_ref: paymentRef,
      })

      const newCount = (referrerOrg.paying_referrals_count ?? 0) + 1
      const goalReached = (referrerOrg.referral_discount_active ?? 0) === 0 && newCount >= REFERRAL_GOAL

      await db.update(organizations).set({
        paying_referrals_count: sql`${organizations.paying_referrals_count} + 1`,
        ...(goalReached ? {
          referral_discount_active: 1,
          referral_discount_expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        } : {}),
        updated_at: new Date().toISOString(),
      }).where(eq(organizations.id, referrerOrg.id))

      if (goalReached) {
        console.log(`[webhook/stripe] Merchant ${referrerOrg.id} hit ${REFERRAL_GOAL} referrals — 50% discount activated!`)
      }
    }
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, subscriptions, referrals, affiliates, payments_log } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { verifyPaystackSignature } from '@/lib/payments'
import { normalizePlan } from '@/lib/payments'

const REFERRAL_GOAL = 10
const FIRST_COMMISSION_RATE = 0.40
const RECURRING_COMMISSION_RATE = 0.10

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') || ''
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || ''

  if (!verifyPaystackSignature(body, signature, secret)) {
    console.error('[webhook/paystack] Invalid signature')
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
      metadata: { org_id?: string; plan?: string; saas_subscription?: boolean }
      subscription_code?: string
      next_payment_date?: string
    }
  }

  const { data } = event

  switch (event.event) {
    case 'charge.success': {
      const orgId = data.metadata?.org_id
      if (!orgId) break

      // ── IDEMPOTENCY CHECK ─────────────────────────────────────────────
      // Use provider:reference as the unique key so retries are no-ops.
      const idempotencyKey = `paystack:${data.reference}`
      const already = await db.query.payments_log.findFirst({
        where: eq(payments_log.idempotency_key, idempotencyKey),
      })
      if (already) {
        console.log(`[webhook/paystack] Duplicate event ${idempotencyKey} — skipping`)
        break
      }

      const plan = normalizePlan(data.metadata?.plan || 'starter')
      const amountUsd = data.amount / 100
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      // ── UPDATE ORG PLAN ───────────────────────────────────────────────
      await db.update(organizations)
        .set({ plan, updated_at: new Date().toISOString() })
        .where(eq(organizations.id, orgId))

      // ── UPSERT SUBSCRIPTION ───────────────────────────────────────────
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.org_id, orgId),
      })
      if (existingSub) {
        await db.update(subscriptions).set({
          status: 'active', plan,
          currency: data.currency,
          amount: amountUsd,
          paystack_subscription_code: data.subscription_code ?? null,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }).where(eq(subscriptions.org_id, orgId))
      } else {
        await db.insert(subscriptions).values({
          org_id: orgId, plan, status: 'active', provider: 'paystack',
          amount: amountUsd, currency: data.currency,
          paystack_subscription_code: data.subscription_code ?? null,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
        })
      }

      // ── LOG PAYMENT (idempotency) ─────────────────────────────────────
      await db.insert(payments_log).values({
        org_id: orgId,
        type: 'saas_subscription',
        provider: 'paystack',
        provider_reference: data.reference,
        amount: amountUsd,
        currency: data.currency,
        status: 'success',
        idempotency_key: idempotencyKey,
        metadata: JSON.stringify(data.metadata),
      })

      // ── AFFILIATE COMMISSION LOGIC ────────────────────────────────────
      const orgRecord = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      })

      if (orgRecord?.referred_by) {
        // Look up affiliate by referral_code
        const affiliate = await db.query.affiliates.findFirst({
          where: and(
            eq(affiliates.referral_code, orgRecord.referred_by),
            eq(affiliates.status, 'approved'),
          ),
        })

        if (affiliate) {
          // Is this the first paid subscription for this org?
          const priorCommissions = await db.query.referrals.findFirst({
            where: and(
              eq(referrals.referral_code, affiliate.referral_code),
              eq(referrals.referred_org_id, orgId),
              eq(referrals.status, 'paid'),
            ),
          })

          const isFirst = !priorCommissions
          const rate = isFirst ? FIRST_COMMISSION_RATE : RECURRING_COMMISSION_RATE
          const commission = Math.round(amountUsd * rate * 100) / 100

          // Record the commission
          await db.insert(referrals).values({
            referrer_org_id: affiliate.id, // affiliate's own id as placeholder org
            referred_org_id: orgId,
            referral_code: affiliate.referral_code,
            status: 'paid',
            reward_type: isFirst ? 'affiliate_first' : 'affiliate_recurring',
            reward_amount: commission,
            is_first_payment: isFirst ? 1 : 0,
            payment_ref: data.reference,
          })

          // Update affiliate balance + totals
          await db.update(affiliates).set({
            balance: sql`${affiliates.balance} + ${commission}`,
            total_earned: sql`${affiliates.total_earned} + ${commission}`,
            total_referred: isFirst
              ? sql`${affiliates.total_referred} + 1`
              : affiliates.total_referred,
            updated_at: new Date().toISOString(),
          }).where(eq(affiliates.id, affiliate.id))

          console.log(`[webhook/paystack] Credited ${commission} USD (${isFirst ? '40%' : '10%'}) to affiliate ${affiliate.email}`)
        }

        // ── MERCHANT REFERRAL TRACKING ──────────────────────────────────
        // Find the merchant org whose referral_code = orgRecord.referred_by
        const referrerOrg = await db.query.organizations.findFirst({
          where: eq(organizations.referral_code, orgRecord.referred_by),
        })

        if (referrerOrg) {
          // Check if this is the FIRST time this org has paid (avoid double-counting)
          const alreadyCounted = await db.query.referrals.findFirst({
            where: and(
              eq(referrals.referral_code, referrerOrg.referral_code!),
              eq(referrals.referred_org_id, orgId),
              eq(referrals.reward_type, 'merchant_referral'),
            ),
          })

          if (!alreadyCounted) {
            // Record merchant referral
            await db.insert(referrals).values({
              referrer_org_id: referrerOrg.id,
              referred_org_id: orgId,
              referral_code: referrerOrg.referral_code!,
              status: 'paid',
              reward_type: 'merchant_referral',
              reward_amount: 0,
              is_first_payment: 1,
              payment_ref: data.reference,
            })

            // Increment merchant's paying_referrals_count
            const newCount = (referrerOrg.paying_referrals_count ?? 0) + 1
            const discountAlreadyActive = (referrerOrg.referral_discount_active ?? 0) === 1
            const goalReached = !discountAlreadyActive && newCount >= REFERRAL_GOAL

            await db.update(organizations).set({
              paying_referrals_count: sql`${organizations.paying_referrals_count} + 1`,
              ...(goalReached ? {
                referral_discount_active: 1,
                referral_discount_expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
              } : {}),
              updated_at: new Date().toISOString(),
            }).where(eq(organizations.id, referrerOrg.id))

            if (goalReached) {
              console.log(`[webhook/paystack] Merchant ${referrerOrg.id} hit 10 referrals — 50% discount activated!`)
            }
          }
        }
      }
      break
    }

    case 'subscription.disable':
    case 'subscription.not_renew': {
      const orgId = data.metadata?.org_id
      if (!orgId) break
      await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.org_id, orgId))
      await db.update(organizations).set({ plan: 'free', updated_at: new Date().toISOString() }).where(eq(organizations.id, orgId))
      break
    }
  }

  return NextResponse.json({ received: true })
}

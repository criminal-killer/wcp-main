import Stripe from 'stripe'
import crypto from 'crypto'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// ============================================
// Plan Configuration (Single Source of Truth)
// ============================================

export type PlanId = 'starter' | 'pro' | 'elite'

export const PLAN_CONFIG: Record<PlanId, {
  name: string
  price_usd: number // in dollars
  price_cents: number // in cents for Stripe
  price_kobo: number // in kobo for Paystack (USD * 100 * 100 for Paystack USD)
  paystack_plan_code_env: string
  stripe_price_id_env: string
  features: string[]
  product_limit: number
  ai_custom: boolean
  white_label: boolean
}> = {
  starter: {
    name: 'Starter',
    price_usd: 29,
    price_cents: 2900,
    price_kobo: 2900 * 100,
    paystack_plan_code_env: 'PAYSTACK_STARTER_PLAN_CODE',
    stripe_price_id_env: 'STRIPE_STARTER_PRICE_ID',
    features: ['100 Products', 'Chatevo AI Default', 'Standard Admin', 'WhatsApp Storefront', '7-Day Free Trial'],
    product_limit: 100,
    ai_custom: false,
    white_label: false,
  },
  pro: {
    name: 'Pro',
    price_usd: 59,
    price_cents: 5900,
    price_kobo: 5900 * 100,
    paystack_plan_code_env: 'PAYSTACK_PRO_PLAN_CODE',
    stripe_price_id_env: 'STRIPE_PRO_PRICE_ID',
    features: ['500 Products', 'Custom AI Agent (Gemini/GPT)', 'Advanced Analytics', 'Bulk Product Upload', 'Abandoned Cart Recovery'],
    product_limit: 500,
    ai_custom: true,
    white_label: false,
  },
  elite: {
    name: 'Elite',
    price_usd: 99,
    price_cents: 9900,
    price_kobo: 9900 * 100,
    paystack_plan_code_env: 'PAYSTACK_ELITE_PLAN_CODE',
    stripe_price_id_env: 'STRIPE_ELITE_PRICE_ID',
    features: ['5,000 Products', 'White-label Storefront', 'Dedicated Account Manager', 'Custom API Integrations', 'Priority AI Processing'],
    product_limit: 5000,
    ai_custom: true,
    white_label: true,
  },
}

export function isValidPlan(plan: string): plan is PlanId {
  return plan === 'starter' || plan === 'pro' || plan === 'elite'
}

export function normalizePlan(plan: string): PlanId {
  // Normalize any legacy names
  if (plan === 'growth') return 'pro'
  if (plan === 'premium') return 'elite'
  if (isValidPlan(plan)) return plan
  return 'starter'
}

// ============================================
// SaaS Subscription Payments (Store Owner → Chatevo)
// ============================================

export async function createPaystackSubscriptionCheckout(
  email: string,
  orgId: string,
  plan: PlanId
) {
  const config = PLAN_CONFIG[plan]
  const planCode = process.env[config.paystack_plan_code_env]
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&success=paystack&plan=${plan}`

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: config.price_kobo, // Paystack expects smallest unit
      currency: 'USD',
      ...(planCode ? { plan: planCode } : {}), // attach plan code for subscription if configured
      callback_url: callbackUrl,
      metadata: { org_id: orgId, plan, saas_subscription: true },
    }),
  })

  const data = await response.json() as Record<string, unknown>
  const dataObj = data.data as Record<string, unknown> | undefined
  return dataObj?.authorization_url as string | undefined
}

export async function createStripeSubscriptionCheckout(
  email: string,
  orgId: string,
  plan: PlanId
) {
  const config = PLAN_CONFIG[plan]
  const priceId = process.env[config.stripe_price_id_env]

  if (!priceId) {
    // Fallback: create an ad-hoc price if no Price ID is configured
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Chatevo ${config.name} Plan` },
          unit_amount: config.price_cents,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: { org_id: orgId, plan },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&success=stripe&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&cancelled=true`,
    })
    return session.url ?? undefined
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { org_id: orgId, plan },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&success=stripe&plan=${plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&cancelled=true`,
  })
  return session.url ?? undefined
}

// ============================================
// Store Payments (Customer → Store Owner)
// ============================================

export async function createStorePaymentLink(
  storePaystackKey: string | null | undefined,
  {
    email,
    amount,
    currency,
    reference,
    metadata,
  }: {
    email: string
    amount: number
    currency: string
    reference: string
    metadata: Record<string, unknown>
  }
) {
  // Use Chatevo's key if store doesn't have one (MoR / Managed mode)
  const apiKey = storePaystackKey || process.env.PAYSTACK_SECRET_KEY

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // smallest unit
      currency,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/store-webhook`,
      metadata,
    }),
  })
  const data = await response.json() as Record<string, unknown>
  const dataObj = data.data as Record<string, unknown> | undefined
  return dataObj?.authorization_url as string | undefined
}

// ============================================
// Webhook Signature Verification
// ============================================

export function verifyPaystackSignature(
  body: string,
  signature: string,
  secretKey: string
): boolean {
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex')
  return hash === signature
}

export function verifyStripeWebhook(
  body: string,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

// ============================================
// Paystack Transfers (Chatevo → Store Owner)
// ============================================

export async function createTransferRecipient(recipientData: {
  type: 'nuban' | 'mobile_money'
  name: string
  account_number: string
  bank_code: string
  currency: string
}) {
  const response = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recipientData),
  })
  const data = await response.json()
  return data.data?.recipient_code as string | undefined
}

export async function initiatePaystackTransfer(transferData: {
  amount: number // in smallest unit
  recipient: string // recipient_code
  reason?: string
  reference?: string
}) {
  const response = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      ...transferData,
    }),
  })
  const data = await response.json()
  return data.data as { reference: string; status: string; transfer_code: string } | undefined
}

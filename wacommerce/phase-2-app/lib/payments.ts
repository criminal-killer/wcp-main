import Stripe from 'stripe'
import crypto from 'crypto'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// ============================================
// SaaS Subscription Payments (Store Owner → Sella)
// ============================================

export async function createPaystackSubscriptionCheckout(
  email: string,
  orgId: string,
  plan: 'starter' | 'growth' | 'premium'
) {
  const planCodes: Record<string, string> = {
    starter: process.env.PAYSTACK_STARTER_PLAN_CODE || 'PLN_starter',
    growth: process.env.PAYSTACK_GROWTH_PLAN_CODE || 'PLN_growth',
    premium: process.env.PAYSTACK_PREMIUM_PLAN_CODE || 'PLN_premium',
  }
  const amounts: Record<string, number> = {
    starter: 2900,
    growth: 5900,
    premium: 9900,
  }
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amounts[plan] * 100, // in kobo
      currency: 'USD',
      plan: planCodes[plan],
      callback_url: callbackUrl,
      metadata: { org_id: orgId, plan },
    }),
  })

  const data = await response.json() as Record<string, unknown>
  const dataObj = data.data as Record<string, unknown> | undefined
  return dataObj?.authorization_url as string | undefined
}

export async function createPayPalSubscriptionCheckout(
  email: string,
  orgId: string,
  plan: 'starter' | 'growth' | 'premium'
) {
  // In production, use @paypal/checkout-server-sdk to create a subscription
  // return approval_url from PayPal API response
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true&provider=paypal&plan=${plan}`
  return redirectUrl
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
  // Use Sella's key if store doesn't have one (MoR / Managed mode)
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
// Paystack Transfers (Sella → Store Owner)
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

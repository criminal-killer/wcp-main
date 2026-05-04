import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { affiliates, affiliate_payouts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

const MIN_PAYOUT_USD = 100

// POST /api/affiliates/payout-request
// Affiliate requests a payout of their full balance.
// Admin must then review and mark it as paid via the admin panel.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string }
    const email = body.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'email is required.' }, { status: 400 })
    }

    const affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.email, email),
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found.' }, { status: 404 })
    }

    if (affiliate.status !== 'approved') {
      return NextResponse.json({
        error: 'Your account must be approved before requesting a payout.',
      }, { status: 403 })
    }

    const balance = affiliate.balance ?? 0

    if (balance < MIN_PAYOUT_USD) {
      return NextResponse.json({
        error: `Minimum payout is $${MIN_PAYOUT_USD}. Current balance: $${balance.toFixed(2)}.`,
        balance,
        minimum: MIN_PAYOUT_USD,
      }, { status: 422 })
    }

    // Check for an already-pending payout request
    const pendingRequest = await db.query.affiliate_payouts.findFirst({
      where: and(
        eq(affiliate_payouts.affiliate_id, affiliate.id),
        eq(affiliate_payouts.status, 'pending'),
      ),
    })

    if (pendingRequest) {
      return NextResponse.json({
        error: 'You already have a pending payout request. Please wait for it to be processed.',
        amount: pendingRequest.amount,
        status: 'pending',
        requested_at: pendingRequest.created_at,
      }, { status: 409 })
    }

    // Create the payout request
    await db.insert(affiliate_payouts).values({
      affiliate_id: affiliate.id,
      amount: balance,
      status: 'pending',
      notes: `Payout requested by affiliate. Payment details: ${affiliate.payment_details || 'Not provided'}`,
    })

    return NextResponse.json({
      success: true,
      amount: balance,
      status: 'pending',
      message: `Payout request of $${balance.toFixed(2)} submitted. Our team will process within 5 business days.`,
    })
  } catch (err: unknown) {
    console.error('[affiliates/payout-request] Error:', err)
    return NextResponse.json({ error: 'Failed to submit payout request.' }, { status: 500 })
  }
}

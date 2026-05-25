export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { affiliates, affiliate_payouts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

const MIN_PAYOUT_USD = 100

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details from Clerk
    const client = typeof clerkClient === 'function' ? await (clerkClient as any)() : clerkClient
    const clerkUser = await client.users.getUser(userId)
    const primaryEmailId = clerkUser.primaryEmailAddressId
    const primaryEmail = clerkUser.emailAddresses.find((e: any) => e.id === primaryEmailId)
    const clerkEmailLower = (primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '').toLowerCase()

    // Find affiliate by clerk_id first, then fallback to email
    let affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.clerk_id, userId),
    })

    if (!affiliate && clerkEmailLower) {
      affiliate = await db.query.affiliates.findFirst({
        where: eq(affiliates.email, clerkEmailLower),
      })

      // Backfill clerk_id if matched by email
      if (affiliate) {
        await db.update(affiliates)
          .set({ clerk_id: userId })
          .where(eq(affiliates.id, affiliate.id))
        affiliate.clerk_id = userId
      }
    }

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

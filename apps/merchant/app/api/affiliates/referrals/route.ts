import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { affiliates, referrals, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ error: 'Affiliate account is not approved.', status: affiliate.status }, { status: 403 })
  }

  // Get all orgs referred by this affiliate's code
  const referred_orgs = await db.select({
    id: organizations.id,
    name: organizations.name,
    plan: organizations.plan,
    created_at: organizations.created_at,
  })
    .from(organizations)
    .where(eq(organizations.referred_by, affiliate.referral_code))

  // Get commission records for each referred org
  const commissions = await db.select()
    .from(referrals)
    .where(and(
      eq(referrals.referral_code, affiliate.referral_code),
      eq(referrals.status, 'paid'),
    ))

  // Join: build enriched list
  const data = referred_orgs.map(org => {
    const orgCommissions = commissions.filter(r => r.referred_org_id === org.id)
    const totalCommission = orgCommissions.reduce((sum, r) => sum + (r.reward_amount ?? 0), 0)
    const firstPayment = orgCommissions.find(r => r.is_first_payment === 1)
    const recurringCount = orgCommissions.filter(r => r.is_first_payment === 0).length

    return {
      org_id: org.id,
      org_name: org.name,
      plan: org.plan,
      signed_up: org.created_at,
      is_paying: org.plan !== 'trial' && org.plan !== 'free',
      total_commission: Math.round(totalCommission * 100) / 100,
      first_payment_commission: firstPayment ? firstPayment.reward_amount : null,
      recurring_payments: recurringCount,
    }
  })

  return NextResponse.json({ data, total: data.length })
}

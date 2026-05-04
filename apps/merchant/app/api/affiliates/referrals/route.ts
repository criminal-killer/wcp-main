import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { affiliates, referrals, organizations } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/affiliates/referrals?email=jane@example.com
// Returns the list of orgs that signed up with this affiliate's code,
// grouped by their payment status.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ error: 'email query parameter is required.' }, { status: 400 })
  }

  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.email, email),
  })

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

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const REFERRAL_GOAL = 10

// GET /api/referrals/me
// Returns the authenticated merchant's referral stats.
// Uses org.referral_code as the merchant's invite code.
// paying_referrals_count is incremented by the payment webhook.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.org_id),
  })
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.app'

  // Use referral_code if set, otherwise use org id prefix as fallback
  const code = org.referral_code || org.id.slice(0, 8).toUpperCase()
  const payingCount = org.paying_referrals_count ?? 0
  const discountActive = (org.referral_discount_active ?? 0) === 1

  return NextResponse.json({
    referral_code: code,
    referral_link: `${appUrl}/?ref=${code}`,
    paying_referrals_count: payingCount,
    goal: REFERRAL_GOAL,
    percentage: Math.min(100, Math.round((payingCount / REFERRAL_GOAL) * 100)),
    discount_active: discountActive,
    discount_expires_at: org.referral_discount_expires_at ?? null,
    goal_reached: discountActive || payingCount >= REFERRAL_GOAL,
  })
}

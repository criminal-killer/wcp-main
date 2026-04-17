import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/referrals — return real referral stats for current org
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    // If no referral code yet, generate one
    let referralCode = org.referral_code
    if (!referralCode) {
      referralCode = `CHATEVO-${org.id.slice(0, 6).toUpperCase()}`
      await db.update(organizations)
        .set({ referral_code: referralCode })
        .where(eq(organizations.id, org.id))
    }

    // Count orgs referred by this org's code
    const referredOrgs = await db.query.organizations.findMany({
      where: eq(organizations.referred_by, referralCode),
      columns: { id: true, plan: true, created_at: true, name: true }
    })

    const activeReferrals = referredOrgs.filter(o => o.plan !== 'trial').length
    const totalReferrals = referredOrgs.length

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.app'}/?ref=${referralCode}`

    return NextResponse.json({
      referral_code: referralCode,
      referral_link: referralLink,
      total_referrals: totalReferrals,
      active_referrals: activeReferrals,
      referred_list: referredOrgs.map(o => ({
        name: o.name,
        plan: o.plan,
        joined_at: o.created_at,
        status: o.plan === 'trial' ? 'trial' : 'paid',
      }))
    })
  } catch (err) {
    console.error('[REFERRALS GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

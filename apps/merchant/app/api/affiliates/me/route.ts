import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { affiliates } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// GET /api/affiliates/me?email=jane@example.com
// Looks up an affiliate by email (provided as query param).
// The affiliate dashboard is not behind Clerk — affiliates sign up
// externally and receive approval emails. We auth by email.
// In future this can be upgraded to clerk_id once affiliates have accounts.
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
    return NextResponse.json({ error: 'No affiliate account found for this email.' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.app'

  return NextResponse.json({
    id: affiliate.id,
    name: affiliate.name,
    email: affiliate.email,
    status: affiliate.status,
    referral_code: affiliate.referral_code,
    referral_link: `${appUrl}/?ref=${affiliate.referral_code}`,
    total_referred: affiliate.total_referred ?? 0,
    total_earned: affiliate.total_earned ?? 0,
    balance: affiliate.balance ?? 0,
    payment_details: affiliate.payment_details,
    created_at: affiliate.created_at,
  })
}

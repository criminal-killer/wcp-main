import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { affiliates } from '@/lib/schema'
import { eq } from 'drizzle-orm'

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
    return NextResponse.json({ error: 'No affiliate account found.' }, { status: 404 })
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

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { affiliates } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { logError, categorizeError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details from Clerk
    const client = typeof clerkClient === 'function' ? await (clerkClient as any)() : clerkClient
    const clerkUser = await client.users.getUser(userId)
    const primaryEmailId = clerkUser.primaryEmailAddressId
    const primaryEmailObj = clerkUser.emailAddresses.find((e: any) => e.id === primaryEmailId)
    const rawEmail = primaryEmailObj?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || ''
    const emailNorm = rawEmail.trim().toLowerCase()

    // Find affiliate by clerk_id first
    let affiliate = await db.query.affiliates.findFirst({
      where: eq(affiliates.clerk_id, userId),
    })

    // Fallback to email match
    if (!affiliate && emailNorm) {
      affiliate = await db.query.affiliates.findFirst({
        where: sql`lower(trim(${affiliates.email})) = ${emailNorm}`,
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
      const emailDomain = emailNorm.split('@')[1] || 'unknown'
      console.warn({ where: "affiliates-me", userId, emailDomain })
      return NextResponse.json({ error: 'No affiliate application found for this account' }, { status: 404 })
    }

    const proto = req.headers.get('x-forwarded-proto') ?? 'https'
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        status: affiliate.status,
        referral_code: affiliate.referral_code,
        referral_link: `${baseUrl}/?ref=${affiliate.referral_code}`,
        total_referred: affiliate.total_referred ?? 0,
        total_earned: affiliate.total_earned ?? 0,
        balance: affiliate.balance ?? 0,
        payment_details: affiliate.payment_details,
        created_at: affiliate.created_at,
      }
    })
  } catch (error) {
    console.error('[affiliates/me]', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

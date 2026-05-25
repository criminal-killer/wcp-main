export const dynamic = "force-dynamic"

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, affiliates } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendWelcomeEmail } from '@/lib/email'

const COUNTRIES_MAP: Record<string, { currency: string; timezone: string }> = {
  KE: { currency: 'KES', timezone: 'Africa/Nairobi' },
  NG: { currency: 'NGN', timezone: 'Africa/Lagos' },
  GH: { currency: 'GHS', timezone: 'Africa/Accra' },
  ZA: { currency: 'ZAR', timezone: 'Africa/Johannesburg' },
  UG: { currency: 'UGX', timezone: 'Africa/Kampala' },
  TZ: { currency: 'TZS', timezone: 'Africa/Dar_es_Salaam' },
  US: { currency: 'USD', timezone: 'America/New_York' },
  GB: { currency: 'GBP', timezone: 'Europe/London' },
  IN: { currency: 'INR', timezone: 'Asia/Kolkata' },
  OTHER: { currency: 'USD', timezone: 'UTC' },
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    
    // If they exist, verify their org is valid
    if (existingUser && existingUser.org_id && existingUser.org_id !== 'system') {
      const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.id, existingUser.org_id)
      })
      if (existingOrg) {
        return NextResponse.json({ data: { org_id: existingOrg.id }, message: 'Already onboarded' })
      }
    }

    const body = await req.json() as { name: string; country: string; business_type: string; plan?: string }
    const { name, country = 'KE', business_type, plan = 'trial' } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
    }

    const countryData = COUNTRIES_MAP[country] || COUNTRIES_MAP.OTHER

    // Check for affiliate referral
    const refCode = req.cookies.get('affiliate_ref')?.value
    let validReferralCode = null

    if (refCode) {
      const affiliate = await db.query.affiliates.findFirst({
        where: eq(affiliates.referral_code, refCode)
      })
      if (affiliate) {
        validReferralCode = affiliate.referral_code
      }
    }

    // Create org (Drizzle will auto-generate the uuid via default)
    const slug = slugify(name)
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const [org] = await db.insert(organizations).values({
      name: name.trim(),
      slug,
      country,
      currency: countryData.currency,
      timezone: countryData.timezone,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
      referred_by: validReferralCode,
    }).returning()

    let email = ''
    let userName = ''
    try {
      // @ts-ignore - Handle both Clerk v4 and v5 exports
      const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient
      const clerkUser = await client.users.getUser(userId)
      const primaryEmailId = clerkUser.primaryEmailAddressId
      const primaryEmail = clerkUser.emailAddresses.find((e: any) => e.id === primaryEmailId)
      email = primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || ''
      userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    } catch (e) {
      console.error('[Onboarding] Failed to fetch Clerk user details:', e)
    }

    let finalUser;
    
    // Create or update user
    if (existingUser) {
      [finalUser] = await db.update(users).set({
        org_id: org.id,
        email: email || existingUser.email,
        name: userName || existingUser.name,
        role: 'owner',
      }).where(eq(users.clerk_id, userId)).returning()
    } else {
      [finalUser] = await db.insert(users).values({
        clerk_id: userId,
        org_id: org.id,
        email: email, // Pulled from Clerk synchronously
        name: userName,
        role: 'owner',
      }).returning()
    }

    // Send welcome email (best-effort)
    try {
      await sendWelcomeEmail(finalUser.email || '', name.trim(), name.trim())
    } catch (err) {
      console.error('Welcome email failed:', err)
    }

    const response = NextResponse.json({
      data: { org_id: org.id, slug: org.slug },
      message: 'Store created successfully',
    }, { status: 201 })

    if (validReferralCode) {
      response.cookies.delete('affiliate_ref')
    }

    return response
  } catch (error: any) {
    console.error('Onboarding error:', error)
    if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Database connection failed: Unauthorized. Please check your Turso credentials.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create store. Please try again later.' }, { status: 500 })
  }
}

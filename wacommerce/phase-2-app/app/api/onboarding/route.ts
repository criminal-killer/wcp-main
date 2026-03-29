import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
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
    // Check if user already onboarded
    const existing = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (existing) return NextResponse.json({ data: { org_id: existing.org_id }, message: 'Already onboarded' })

    const body = await req.json() as { name: string; country: string; business_type: string; plan?: string }
    const { name, country = 'KE', business_type, plan = 'trial' } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
    }

    const countryData = COUNTRIES_MAP[country] || COUNTRIES_MAP.OTHER

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
    }).returning()

    // Create user
    const [user] = await db.insert(users).values({
      clerk_id: userId,
      org_id: org.id,
      email: '', // Will be updated from Clerk webhook
      role: 'owner',
    }).returning()

    // Send welcome email (best-effort)
    try {
      await sendWelcomeEmail(user.email || '', name.trim(), name.trim())
    } catch (err) {
      console.error('Welcome email failed:', err)
    }

    return NextResponse.json({
      data: { org_id: org.id, slug: org.slug },
      message: 'Store created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Database connection failed: Unauthorized. Please check your Turso credentials.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create store. Please try again later.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { affiliates } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// POST /api/affiliates/apply
// Public — no Clerk auth required. Anyone can apply.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string
      email?: string
      phone?: string
      payment_details?: string
    }

    const { name, email, phone, payment_details } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Check for existing application
    const existing = await db.query.affiliates.findFirst({
      where: eq(affiliates.email, emailLower),
    })

    if (existing) {
      // Return their current status so UI can show the right state
      return NextResponse.json({
        error: 'An application with this email already exists.',
        status: existing.status,
      }, { status: 409 })
    }

    // Generate a unique referral code: first 4 letters of name + 4 random chars (uppercased)
    const namePart = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
    const randPart = Math.random().toString(36).slice(2, 6).toUpperCase()
    const referralCode = `${namePart}${randPart}`

    await db.insert(affiliates).values({
      name: name.trim(),
      email: emailLower,
      phone: phone?.trim() || null,
      referral_code: referralCode,
      payment_details: payment_details?.trim() || null,
      status: 'pending',
      terms_accepted: 1,
    })

    return NextResponse.json({
      success: true,
      message: 'Application submitted. Our team will review within 2 business days and email you once approved.',
      referral_code: referralCode,
    })
  } catch (err: unknown) {
    console.error('[affiliates/apply] Error:', err)
    return NextResponse.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 })
  }
}

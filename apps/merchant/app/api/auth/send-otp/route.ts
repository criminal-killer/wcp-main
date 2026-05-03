import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

// Store OTP in-memory for edge simplicity (Redis would be better for multi-instance)
// We use a signed HMAC to avoid needing a store — OTP is encoded in a signed cookie.
// For production at scale, replace with Upstash Redis.

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999))
}

async function sendOtpEmail(to: string, otp: string, name: string) {
  // Uses Resend if configured, otherwise logs to server console (dev mode)
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn(`[OTP] No RESEND_API_KEY configured. OTP for ${to}: ${otp}`)
    return true
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Chatevo Security <security@${process.env.EMAIL_FROM_DOMAIN || 'chatevo.io'}>`,
      to,
      subject: 'Your Chatevo Security Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#075E54">Security Verification</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Your one-time access code for Chatevo Settings is:</p>
          <div style="background:#f0fdf4;border:2px solid #075E54;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:900;letter-spacing:0.5em;color:#075E54;font-family:monospace">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:14px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#6b7280;font-size:12px">If you did not request this, please ignore this email.</p>
        </div>
      `,
    }),
  })

  return res.ok
}

const OTP_SECRET = process.env.OTP_HMAC_SECRET || 'chatevo-otp-secret-change-in-production'

function signOtp(otp: string, userId: string, expiresAt: number): string {
  const payload = `${otp}:${userId}:${expiresAt}`
  const sig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url')
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user?.email) return NextResponse.json({ error: 'User email not found' }, { status: 404 })

  const otp = generateOtp()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  const token = signOtp(otp, userId, expiresAt)

  const sent = await sendOtpEmail(user.email, otp, user.name || '')
  if (!sent) return NextResponse.json({ error: 'Failed to send OTP email. Please try again.' }, { status: 500 })

  const response = NextResponse.json({ success: true, message: 'Code sent to your registered email.' })
  // Store signed token in httpOnly cookie (10 min TTL)
  response.cookies.set('__otp_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 600,
    path: '/',
  })
  return response
}

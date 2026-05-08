import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const OTP_SECRET = process.env.OTP_HMAC_SECRET || 'chatevo-otp-secret-change-in-production'

// How long the "unlocked" state persists after a successful OTP verification (20 minutes)
const UNLOCK_TTL_MS = 20 * 60 * 1000
const UNLOCK_TTL_SECONDS = UNLOCK_TTL_MS / 1000

function signPayload(payload: string): string {
  const sig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url')
}

function verifyToken(token: string, userId: string, submittedCode: string): { valid: boolean; reason?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'))
    const { payload, sig } = decoded as { payload: string; sig: string }

    // Verify signature
    const expectedSig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { valid: false, reason: 'Invalid token signature.' }
    }

    const [otp, tokenUserId, expiresAtStr] = payload.split(':')

    // Ensure token belongs to the requesting user
    if (tokenUserId !== userId) {
      return { valid: false, reason: 'Token mismatch.' }
    }

    // Check expiry
    if (Date.now() > Number(expiresAtStr)) {
      return { valid: false, reason: 'Code has expired. Please request a new one.' }
    }

    // Constant-time comparison of OTP
    if (!crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(submittedCode))) {
      return { valid: false, reason: 'Invalid code. Please try again.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: 'Invalid or corrupted token.' }
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { code?: string }
  const { code } = body

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'A 6-digit numeric code is required.' }, { status: 400 })
  }

  const token = req.cookies.get('__otp_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'No pending OTP. Please request a new code.' }, { status: 400 })
  }

  const result = verifyToken(token, userId, code)

  if (!result.valid) {
    return NextResponse.json({ error: result.reason || 'Verification failed.' }, { status: 400 })
  }

  // Clear the OTP challenge cookie and set a longer-lived "unlocked" session cookie
  const unlockPayload = `UNLOCKED:${userId}:${Date.now() + UNLOCK_TTL_MS}`
  const unlockToken = signPayload(unlockPayload)

  const response = NextResponse.json({ ok: true, success: true })
  response.cookies.delete('__otp_token')
  response.cookies.set('__otp_unlocked', unlockToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: UNLOCK_TTL_SECONDS,
    path: '/',
  })
  return response
}


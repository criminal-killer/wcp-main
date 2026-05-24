import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const OTP_SECRET = process.env.OTP_HMAC_SECRET
if (!OTP_SECRET) throw new Error('OTP_HMAC_SECRET environment variable is required')

function isTokenValid(token: string, userId: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'))
    const { payload, sig } = decoded as { payload: string; sig: string }

    const expectedSig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return false
    }

    const [, tokenUserId, expiresAtStr] = payload.split(':')
    if (tokenUserId !== userId) return false
    if (Date.now() > Number(expiresAtStr)) return false

    return true
  } catch {
    return false
  }
}

// GET /api/auth/otp-status
// Returns { unlocked: boolean } based on whether a valid __otp_unlocked cookie exists.
// This lets the client restore the unlocked state across a page refresh within the TTL window.
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ unlocked: false })

  const token = req.cookies.get('__otp_unlocked')?.value
  if (!token) return NextResponse.json({ unlocked: false })

  const valid = isTokenValid(token, userId)
  if (!valid) {
    // Clean up expired cookie
    const res = NextResponse.json({ unlocked: false })
    res.cookies.delete('__otp_unlocked')
    return res
  }

  return NextResponse.json({ unlocked: true })
}

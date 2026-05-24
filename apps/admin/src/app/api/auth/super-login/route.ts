import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxAttempts) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Rate limit: 5 attempts per 15 minutes per IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many login attempts. Try again in 15 minutes.' }, { status: 429 })
    }

    // Retrieve credentials from environment variables
    const adminEmail = process.env.SUPER_ADMIN_EMAIL
    const adminPasswordHash = process.env.SUPER_ADMIN_PASSWORD_HASH
    const secret = process.env.SUPER_ADMIN_JWT_SECRET

    if (!adminEmail || !adminPasswordHash || !secret) {
      console.error('Super Admin credentials missing in environment. Required: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD_HASH, SUPER_ADMIN_JWT_SECRET')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Email must match
    if (email !== adminEmail) {
      return NextResponse.json({ error: 'Invalid super admin credentials.' }, { status: 401 })
    }

    // Password verification: bcrypt hash only
    const passwordValid = await bcrypt.compare(password, adminPasswordHash)

    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid super admin credentials.' }, { status: 401 })
    }

    // Create a signed JWT
    const token = await new SignJWT({ email, role: 'super_admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(secret))

    // Set cookie for session
    cookies().set('chatevo_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

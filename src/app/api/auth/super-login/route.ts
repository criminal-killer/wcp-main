import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Retrieve credentials from environment variables
    const adminEmail = process.env.SUPER_ADMIN_EMAIL
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD
    const secret = process.env.SUPER_ADMIN_JWT_SECRET

    if (!adminEmail || !adminPassword || !secret) {
      console.error('Super Admin credentials missing in environment.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Validate credentials
    if (email === adminEmail && password === adminPassword) {
      // Create a signed JWT
      const token = await new SignJWT({ email, role: 'super_admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(new TextEncoder().encode(secret))

      // Set cookie for session
      cookies().set('sella_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid super admin credentials.' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

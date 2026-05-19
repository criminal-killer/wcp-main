import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/store(.*)',
  '/api/health',
  '/docs(.*)',
  '/auth/super-login',
  '/api/webhook(.*)',
  '/api/debug-db(.*)',
  '/api/payments/webhook(.*)',
  '/api/store(.*)',
  '/api/cron(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }

  const res = NextResponse.next()
  const ref = req.nextUrl.searchParams.get('ref')
  
  if (ref && /^[A-Z0-9_-]{3,30}$/i.test(ref)) {
    res.cookies.set('affiliate_ref', ref, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }
  
  return res
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}


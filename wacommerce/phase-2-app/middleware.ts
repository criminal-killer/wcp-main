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
  '/api/webhooks(.*)',
  '/api/webhook(.*)',
  '/api/payments/webhook(.*)',
  '/api/store(.*)',
  '/api/cron(.*)',
  '/api/test(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}


import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

const loginPath = '/login';
const protectedPrefix = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session')?.value;

  // Protect /dashboard routes
  if (pathname.startsWith(protectedPrefix)) {
    if (!session) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    try {
      await decrypt(session);
    } catch {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  // Redirect / to /dashboard if logged in
  if (pathname === '/' || pathname === loginPath) {
    if (session) {
      try {
        await decrypt(session);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Continue to login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

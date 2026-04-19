import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/auth/super-login', 
  '/api/auth/super-login',
  '/waiting-approval(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  const response = NextResponse.next();
  response.headers.set("x-url", request.nextUrl.pathname);

  // 1. Check for Super Admin Backdoor Cookie
  const token = request.cookies.get('chatevo_admin_token')?.value;
  
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.SUPER_ADMIN_JWT_SECRET);
      await jwtVerify(token, secret);
      // Valid Super Admin token found - Grant access to all routes
      return NextResponse.next();
    } catch (err) {
      // Invalid or expired token - proceed to standard Clerk auth
      console.warn("Invalid super admin token, falling back to Clerk.");
    }
  }

  // 2. Standard Clerk Auth for other users
  if (!isPublicRoute(request)) {
    const { userId } = auth();
    
    // Redirect if not signed in via Clerk
    if (!userId) {
      return auth().redirectToSignIn();
    }

    // Security Check: Only specific Clerk Admin ID can access
    const adminId = process.env.ADMIN_USER_ID;
    if (adminId && userId !== adminId) {
      return NextResponse.redirect(new URL('/not-authorized', request.url));
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

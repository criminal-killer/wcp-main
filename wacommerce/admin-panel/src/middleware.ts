import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId } = auth();
    
    // Redirect if not signed in
    if (!userId) {
      return auth().redirectToSignIn();
    }

    // Security Check: Only the platform owner can access any route
    const adminId = process.env.ADMIN_USER_ID;
    if (adminId && userId !== adminId) {
      return NextResponse.redirect(new URL('/not-authorized', request.url));
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

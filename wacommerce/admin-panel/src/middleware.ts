import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Base64url → bytes
function base64UrlToUint8Array(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwtJsonPart(part: string): unknown {
  const bytes = base64UrlToUint8Array(part);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

// Edge-safe HS256 JWT verification using WebCrypto
async function verifyJwtHS256(token: string, secret: string): Promise<void> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const [headerB64, payloadB64, signatureB64] = parts;

  const header = decodeJwtJsonPart(headerB64) as { alg?: string } | null;
  const payload = decodeJwtJsonPart(payloadB64) as { exp?: number; nbf?: number } | null;

  if (!header || header.alg !== "HS256") throw new Error("Invalid JWT alg");

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload?.nbf === "number" && now < payload.nbf) throw new Error("Token not yet valid");
  if (typeof payload?.exp === "number" && now >= payload.exp) throw new Error("Token expired");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToUint8Array(signatureB64);

  const ok = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!ok) throw new Error("Invalid signature");
}

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
  const token = request.cookies.get("chatevo_admin_token")?.value;

  if (token) {
    try {
      const secret = process.env.SUPER_ADMIN_JWT_SECRET;
      if (!secret) throw new Error("SUPER_ADMIN_JWT_SECRET is not set");
      await verifyJwtHS256(token, secret);
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

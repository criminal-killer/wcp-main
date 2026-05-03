/**
 * packages/shared/src/env.ts
 *
 * Zod-based environment variable validation.
 * Import this in each app's server entry to fail fast on missing vars.
 *
 * Usage (in app root layout or instrumentation.ts):
 *   import { validateEnv } from '@chatevo/shared/env'
 *   validateEnv()   // throws on first missing required var
 *
 * NOTE: This file must only be imported server-side (it references process.env).
 * Add `import 'server-only'` in callers if using Next.js App Router.
 */
import { z } from 'zod'

// ─── Merchant App env schema ─────────────────────────────────────────────────
const merchantEnvSchema = z.object({
  // Turso
  TURSO_DATABASE_URL:  z.string().url('[env] TURSO_DATABASE_URL must be a valid URL'),
  TURSO_AUTH_TOKEN:    z.string().min(1, '[env] TURSO_AUTH_TOKEN is required'),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY:                  z.string().min(1),
  CLERK_WEBHOOK_SECRET:              z.string().min(1),

  // WhatsApp
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_APP_SECRET:   z.string().min(1),

  // Payments — Stripe
  STRIPE_SECRET_KEY:    z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // Payments — Paystack
  PAYSTACK_SECRET_KEY:  z.string().min(1),
  PAYSTACK_WEBHOOK_SECRET: z.string().min(1),

  // AI
  GROQ_API_KEY: z.string().min(1),

  // Security
  ENCRYPTION_KEY: z.string().min(32, '[env] ENCRYPTION_KEY must be at least 32 chars'),
  OTP_HMAC_SECRET: z.string().min(32, '[env] OTP_HMAC_SECRET must be at least 32 chars'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

// ─── Admin App env schema ─────────────────────────────────────────────────────
const adminEnvSchema = z.object({
  TURSO_DATABASE_URL: z.string().url('[env] TURSO_DATABASE_URL must be a valid URL'),
  TURSO_AUTH_TOKEN:   z.string().min(1),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY:                  z.string().min(1),

  ADMIN_USER_ID:             z.string().min(1, '[env] ADMIN_USER_ID is required'),
  SUPER_ADMIN_JWT_SECRET:    z.string().min(32, '[env] SUPER_ADMIN_JWT_SECRET must be at least 32 chars'),
})

// ─── Validators ──────────────────────────────────────────────────────────────

function validate<T extends z.ZodTypeAny>(
  schema: T,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(
      `[chatevo] Missing or invalid environment variables for ${label}:\n${issues}\n\n` +
      `Copy .env.example to .env.local and fill in the missing values.`
    )
  }
  return result.data
}

/** Call in merchant app server entry to validate all required env vars. */
export function validateMerchantEnv() {
  return validate(merchantEnvSchema, 'Merchant App')
}

/** Call in admin app server entry to validate all required env vars. */
export function validateAdminEnv() {
  return validate(adminEnvSchema, 'Admin App')
}

/** Generic alias — defaults to merchant schema. */
export const validateEnv = validateMerchantEnv

// ─── Typed env accessors (already-validated, no-throw) ───────────────────────
// Use these only AFTER calling validate*() at app startup.

export function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`[env] ${key} is required but not set.`)
  return val
}

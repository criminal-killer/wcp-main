import { db } from '@/lib/db'
import { errorLogs, organizations, notifications } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import { sendTextMessage } from '@/lib/whatsapp'
import { decrypt } from '@/lib/encryption'

type ErrorSeverity = 'high' | 'low'
type ErrorCategory = 'store_engine' | 'payment' | 'catalog' | 'webhook' | 'general'
type ErrorStatus = 'open' | 'investigating' | 'fixed'
type ErrorSource = 'server' | 'client'

interface ErrorLogInput {
  org_id: string
  severity?: ErrorSeverity
  category?: ErrorCategory
  source?: ErrorSource
  message: string
  cause?: string
  fix?: string
  stack?: string
}

export async function logError(input: ErrorLogInput) {
  try {
    await db.insert(errorLogs).values({
      org_id: input.org_id,
      severity: input.severity || 'high',
      category: input.category || 'general',
      source: input.source || 'server',
      message: input.message.slice(0, 1000),
      cause: input.cause?.slice(0, 2000),
      fix: input.fix?.slice(0, 2000),
      stack: input.stack?.slice(0, 5000),
      status: 'open',
      created_at: new Date().toISOString(),
    })

    // Auto-notify for high-severity server-side errors
    if (input.severity === 'high' && input.source !== 'client') {
      await autoNotify(input).catch(err => {
        console.error('[error-logger] Auto-notify failed:', err)
      })
    }
  } catch (dbErr) {
    console.error('Failed to save error log:', dbErr)
  }
}

async function autoNotify(input: ErrorLogInput) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, input.org_id),
  })
  if (!org) return

  const errorSummary = input.message.slice(0, 200)
  const causeText = input.cause ? `\nCause: ${input.cause.slice(0, 200)}` : ''
  const fixText = input.fix ? `\nSuggested fix: ${input.fix.slice(0, 200)}` : ''

  // 1. In-app notification to merchant
  await db.insert(notifications).values({
    org_id: input.org_id,
    title: 'System Error Detected',
    message: `We detected an issue with your store: ${errorSummary}. Our team has been notified and is working on a fix.`,
    type: 'error',
    is_read: 0,
    action_url: '/dashboard',
  }).catch(err => console.error('[error-logger] Notification insert failed:', err))

  // 2. Email to admin
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL
  if (adminEmail) {
    const categoryLabel = (input.category || 'general').toUpperCase()
    await sendEmail({
      to: adminEmail,
      subject: `[Chatevo Alert] ${categoryLabel} Error - ${org.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Server Error Alert</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
            <p><strong>Organization:</strong> ${org.name} (${input.org_id})</p>
            <p><strong>Category:</strong> ${categoryLabel}</p>
            <p><strong>Severity:</strong> ${input.severity || 'high'}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
            <p><strong>Error:</strong> ${errorSummary}</p>
            ${input.cause ? `<p><strong>Cause:</strong> ${input.cause.slice(0, 500)}</p>` : ''}
            ${input.fix ? `<p><strong>Fix:</strong> ${input.fix.slice(0, 500)}</p>` : ''}
            ${input.stack ? `<details><summary>Stack Trace</summary><pre style="font-size: 11px; background: #eee; padding: 12px; border-radius: 4px; overflow-x: auto;">${input.stack.slice(0, 2000)}</pre></details>` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
            <p style="font-size: 12px; color: #666;">View in admin: <a href="${process.env.ADMIN_URL || 'https://admin-chatevo.vercel.app'}/system/error-logs">Error Logs</a></p>
          </div>
        </div>
      `,
    }).catch(err => console.error('[error-logger] Admin email failed:', err))
  }

  // 3. WhatsApp to merchant (if they have credentials)
  if (org.wa_phone_number_id && org.wa_access_token_encrypted) {
    // Find the org owner to get their phone for notification
    // We send to the org's WhatsApp number as a system message
    // This is a self-notification — we use the same channel
    try {
      const accessToken = decrypt(org.wa_access_token_encrypted)
      // We can't send to ourselves via the same WhatsApp API, so we skip WhatsApp self-notification
      // Instead, the in-app notification + email covers it
      void accessToken // suppress unused warning
    } catch {
      // Decrypt failed — skip WhatsApp
    }
  }
}

export const ERROR_FIXES: Record<string, { cause: string; fix: string }> = {
  'Redis connection failed': {
    cause: 'Upstash Redis endpoint is unreachable or credentials are wrong.',
    fix: 'Check REDIS_URL and REDIS_TOKEN in .env.local. Verify Redis is running in Upstash dashboard.',
  },
  'WhatsApp API error': {
    cause: 'Meta WhatsApp API returned an error. Token may be expired or permissions missing.',
    fix: 'Regenerate WhatsApp access token in Meta Business Manager. Ensure whatsapp_business_messaging permission is granted.',
  },
  'Product image invalid': {
    cause: 'Product image URL is missing, malformed, or inaccessible from Meta servers.',
    fix: 'Upload product images to a public URL (Cloudinary, Imgur, or your own server). Ensure the URL starts with https://.',
  },
  'Category match failed': {
    cause: 'Category name in chat does not match any category in the database.',
    fix: 'Verify the category name in the database matches exactly what the customer taps on WhatsApp.',
  },
  'Flow state expired': {
    cause: 'The WhatsApp conversation flow expired (30 min TTL) before the customer completed their action.',
    fix: 'No action needed — customer can restart by typing "Hi". Consider increasing TTL in redis.ts if this happens frequently.',
  },
  'Database query failed': {
    cause: 'Turso database query failed. Could be a connection issue or schema mismatch.',
    fix: 'Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Run npm run db:push to sync schema.',
  },
  'Catalog sync failed': {
    cause: 'Meta Commerce Catalog Batch API returned an error. Invalid product data or catalog not configured.',
    fix: 'Verify meta_business_id, wa_catalog_id, and wa_access_token in settings. Ensure products have valid titles, prices, and image URLs.',
  },
  'Paystack payment link failed': {
    cause: 'Paystack API returned an error when generating payment link.',
    fix: 'Verify PAYSTACK_SECRET_KEY in .env.local. Ensure the merchant has a valid Paystack account.',
  },
  'CTA URL message failed': {
    cause: 'WhatsApp CTA URL button message was rejected. May not be supported for this account.',
    fix: 'Try sending a text message with the payment link instead. Ensure the URL starts with https://.',
  },
  'Interactive list message failed': {
    cause: 'WhatsApp list message was rejected. Row title may exceed 24 character limit or section format is invalid.',
    fix: 'Ensure all category/product names are under 24 characters. Check the sendInteractiveListMessage payload format.',
  },
  'Interactive button message failed': {
    cause: 'WhatsApp button message was rejected. Button title may exceed 20 character limit or image header URL is invalid.',
    fix: 'Ensure button titles are under 20 characters. If using image header, verify the image URL is publicly accessible.',
  },
}

export function categorizeError(err: Error): { category: ErrorCategory; severity: ErrorSeverity; cause: string; fix: string } {
  const msg = err.message || String(err)

  if (msg.includes('Redis') || msg.includes('redis') || msg.includes('ioredis') || msg.includes('connect')) {
    return { category: 'webhook', severity: 'high', cause: ERROR_FIXES['Redis connection failed'].cause, fix: ERROR_FIXES['Redis connection failed'].fix }
  }
  if (msg.includes('WhatsApp') || msg.includes('whatsapp') || msg.includes('400') || msg.includes('API error')) {
    return { category: 'store_engine', severity: 'high', cause: ERROR_FIXES['WhatsApp API error'].cause, fix: ERROR_FIXES['WhatsApp API error'].fix }
  }
  if (msg.includes('JSON') || msg.includes('parse') || msg.includes('image')) {
    return { category: 'store_engine', severity: 'low', cause: ERROR_FIXES['Product image invalid'].cause, fix: ERROR_FIXES['Product image invalid'].fix }
  }
  if (msg.includes('catalog') || msg.includes('Catalog') || msg.includes('Batch')) {
    return { category: 'catalog', severity: 'high', cause: ERROR_FIXES['Catalog sync failed'].cause, fix: ERROR_FIXES['Catalog sync failed'].fix }
  }
  if (msg.includes('Paystack') || msg.includes('payment') || msg.includes('Payment')) {
    return { category: 'payment', severity: 'high', cause: ERROR_FIXES['Paystack payment link failed'].cause, fix: ERROR_FIXES['Paystack payment link failed'].fix }
  }
  if (msg.includes('db') || msg.includes('DB') || msg.includes('database') || msg.includes('Turso')) {
    return { category: 'general', severity: 'high', cause: ERROR_FIXES['Database query failed'].cause, fix: ERROR_FIXES['Database query failed'].fix }
  }

  return { category: 'general', severity: 'low', cause: 'An unexpected error occurred.', fix: 'Check the server logs for details. Restart the service if the issue persists.' }
}

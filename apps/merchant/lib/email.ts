/**
 * lib/email.ts
 *
 * Resend email client — lazy initialized.
 * getResend() returns null when RESEND_API_KEY is not set, which causes
 * all send functions to no-op with a console.warn instead of crashing.
 *
 * This prevents build-time failures during `next build` when env vars
 * may not be present. In production, missing RESEND_API_KEY will surface
 * as a warning in the logs rather than a 500 error on the calling route.
 */
import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'Chatevo <onboarding@resend.dev>'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Chatevo'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://Chatevo-app.vercel.app'

// ─── Lazy singleton ──────────────────────────────────────────────────────────

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY is not set — all emails will be skipped.')
    return null
  }
  _resend = new Resend(key)
  return _resend
}

// ─── Result type ────────────────────────────────────────────────────────────

type SendResult = { sent: true } | { skipped: true; reason: string }

// ─── Email senders ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string,
  orgName: string
): Promise<SendResult> {
  const resend = getResend()
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not set' }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to ${APP_NAME} — Your 14-day trial has started! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #25D366; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Chatevo</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">WhatsApp Commerce Platform</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2>Welcome, ${name}! 👋</h2>
          <p>Your store <strong>${orgName}</strong> is ready to go.</p>
          <p>Your <strong>14-day free trial</strong> has started. No credit card needed.</p>
          <p>Here's what to do next:</p>
          <ol>
            <li>Connect your WhatsApp Business account</li>
            <li>Add your first products</li>
            <li>Share your store link with customers</li>
          </ol>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard"
               style="background: #25D366; color: white; padding: 15px 30px;
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Go to Dashboard →
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Questions? Reply to this email or chat with us.</p>
        </div>
      </div>
    `,
  })
  return { sent: true }
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: string,
  currency: string,
  items: Array<{ name: string; quantity: number; price: number }>
): Promise<SendResult> {
  const resend = getResend()
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not set' }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Order ${orderNumber} Confirmed! ✅`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmed! ✅</h2>
        <p>Order Number: <strong>${orderNumber}</strong></p>
        <table style="width: 100%; border-collapse: collapse;">
          ${items.map(item => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency} ${item.price}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="2" style="padding: 8px; font-weight: bold;">Total</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">${currency} ${total}</td>
          </tr>
        </table>
      </div>
    `,
  })
  return { sent: true }
}

export async function sendTrialEndingEmail(
  email: string,
  name: string,
  daysLeft: number
): Promise<SendResult> {
  const resend = getResend()
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not set' }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `⏰ Your ${APP_NAME} trial ends in ${daysLeft} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your trial ends in ${daysLeft} days, ${name}</h2>
        <p>Don't lose access to your WhatsApp store. Subscribe now for just <strong>$29/month</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/settings/billing"
             style="background: #25D366; color: white; padding: 15px 30px;
                    text-decoration: none; border-radius: 8px; font-weight: bold;">
            Subscribe Now — $29/month →
          </a>
        </div>
      </div>
    `,
  })
  return { sent: true }
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  name: string,
  plan: string
): Promise<SendResult> {
  const resend = getResend()
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not set' }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎉 Subscribed to ${APP_NAME} ${plan} Plan!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You are officially subscribed! 🎉</h2>
        <p>Hi ${name}, thank you for subscribing to the <strong>${plan}</strong> plan.</p>
        <p>Your store is now fully active with no limits.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard"
             style="background: #25D366; color: white; padding: 15px 30px;
                    text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go to Dashboard →
          </a>
        </div>
      </div>
    `,
  })
  return { sent: true }
}

import { db } from '@/lib/db'
import { notifications } from '@/lib/schema'
import { sendEmail } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || ''

interface ErrorNotifyInput {
  org_id: string
  org_name?: string
  message: string
  severity: string
  category: string
  cause?: string
  fix?: string
}

export async function notifyErrorOccurred(input: ErrorNotifyInput) {
  // 1. In-app notification to the affected merchant
  try {
    await db.insert(notifications).values({
      org_id: input.org_id,
      title: 'System Error Detected',
      message: `We've detected an issue${input.category !== 'general' ? ` (${input.category})` : ''}: ${input.message.slice(0, 150)}. Our team has been notified and is working on it.`,
      type: 'error',
      action_url: '/dashboard',
    })
  } catch (err) {
    console.error('[error-notifications] Failed to create in-app notification:', err)
  }

  // 2. Email notification to admin
  if (ADMIN_EMAIL) {
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Chatevo Error] ${input.severity.toUpperCase()}: ${input.message.slice(0, 80)}`,
        html: buildErrorEmailHTML(input),
      })
    } catch (err) {
      console.error('[error-notifications] Failed to send admin email:', err)
    }
  }
}

function buildErrorEmailHTML(input: ErrorNotifyInput): string {
  const severityColor = input.severity === 'high' ? '#ef4444' : '#f59e0b'
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColor}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Chatevo Error Alert</h1>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
        <div style="margin-bottom: 16px;">
          <span style="background: ${severityColor}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${input.severity}</span>
          <span style="background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-left: 8px;">${input.category}</span>
        </div>
        <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">${input.message}</h2>
        ${input.org_name ? `<p style="color: #64748b; font-size: 13px;"><strong>Organization:</strong> ${input.org_name}</p>` : ''}
        ${input.cause ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 0 0 4px; font-weight: bold; color: #92400e; font-size: 12px;">CAUSE</p>
            <p style="margin: 0; color: #78350f; font-size: 13px;">${input.cause}</p>
          </div>
        ` : ''}
        ${input.fix ? `
          <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 0 0 4px; font-weight: bold; color: #166534; font-size: 12px;">HOW TO FIX</p>
            <p style="margin: 0; color: #14532d; font-size: 13px;">${input.fix}</p>
          </div>
        ` : ''}
        <div style="text-align: center; margin: 24px 0 0;">
          <a href="${process.env.ADMIN_URL || 'https://admin-chatevo.vercel.app'}/system/error-logs"
             style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
            View Error Logs
          </a>
        </div>
      </div>
    </div>
  `
}

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { support_tickets, users, organizations, notifications } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import { logError, categorizeError } from '@/lib/error-logger'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { type, subject, description, metadata } = await req.json()

    // Get user and org
    const user = await db.query.users.findFirst({
      where: eq(users.clerk_id, userId),
    })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.org_id!),
    })

    // 1. Save to database
    const [ticket] = await db.insert(support_tickets).values({
      org_id: user.org_id,
      user_id: user.id,
      type: type || 'setup',
      subject: subject || 'Support Request',
      description: description || '',
      metadata: JSON.stringify(metadata || {}),
      status: 'open',
    }).returning()

    // 2. Create in-app notification for the merchant
    await db.insert(notifications).values({
      org_id: user.org_id,
      title: 'Support Ticket Submitted',
      message: `Your "${subject}" ticket has been submitted. We'll respond shortly.`,
      type: 'info',
      action_url: '/dashboard/notifications',
    })

    // 3. Send email notification to merchant
    if (org && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Ticket Received: ${subject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #25D366;">Ticket Received</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>We've received your support ticket and will get back to you shortly.</p>
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <strong>Subject:</strong> ${subject}<br/>
                <strong>Status:</strong> Open
              </div>
              <p>Our team is here to help. You can also reach us directly:</p>
              <p>📞 +254762667048 (Kenya/Africa)<br/>📞 +16416712105 (USA/International)</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Email send error:', emailErr)
      }
    }

    // TODO: Admin WhatsApp notification requires platform WhatsApp credentials (WHATSAPP_PLATFORM_ACCESS_TOKEN + WHATSAPP_PLATFORM_PHONE_ID)
    // Merchant already receives in-app notification + email above

    return NextResponse.json(ticket)
  } catch (error: any) {
    console.error('Ticket creation error:', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}

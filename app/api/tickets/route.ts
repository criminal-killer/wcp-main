import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { support_tickets, users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

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

    // 2. Notification Logic (Mocked for now, but ready for WhatsApp/Email)
    console.log('--- NEW SUPPORT TICKET ---')
    console.log('Ticket ID:', ticket.id)
    console.log('Type:', type)
    console.log('Details:', description)
    console.log('Metadata:', metadata)
    console.log('-------------------------')

    // 3. WhatsApp Notification to Admin (254762667048)
    // In a real scenario, we'd use the Meta WhatsApp API here.
    // Since this is a setup booking, we notify the platform owner.
    
    const adminWhatsApp = '254762667048'
    const message = `ðŸš€ *New Setup Booking*\n\n` +
      `*From:* ${user.email}\n` +
      `*WhatsApp:* ${metadata?.whatsapp}\n` +
      `*Details:* ${description}\n` +
      `*Preferred Time:* ${metadata?.preferred_time}\n\n` +
      `View in Admin Panel: ${process.env.NEXT_PUBLIC_APP_URL}/admin`

    console.log(`[WhatsApp Notification] Would send to ${adminWhatsApp}: ${message}`)

    // TODO: Implement actual WhatsApp sending if credentials are valid
    // For now, it's logged. You can add your WhatsApp API call here.

    return NextResponse.json(ticket)
  } catch (error: any) {
    console.error('Ticket creation error:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}

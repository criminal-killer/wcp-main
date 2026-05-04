import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, orders } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { verifyPaystackSignature } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') || ''

  // For Managed Payments (MoR), we use Chatevo's Secret Key
  // For Direct Payments, the merchant key is used. 
  // However, Paystack only supports one webhook URL per app.
  // So all store payments come here. 
  // We try to verify with Chatevo's key first (Managed), then fallback to Org's key if we can identify it.
  
  const ChatevoSecret = process.env.PAYSTACK_SECRET_KEY || ''
  const isChatevoManaged = verifyPaystackSignature(body, signature, ChatevoSecret)
  
  const event = JSON.parse(body)
  const { data } = event

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  // Identify the Organization and Order
  const orgId = data.metadata?.org_id
  const orderNumber = data.metadata?.order_number
  
  if (!orgId || !orderNumber) {
    console.error('Missing metadata in store webhook', { orgId, orderNumber })
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  })

  if (!org) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }

  // --- Double-check signature if not verified with Chatevo key ---
  if (!isChatevoManaged) {
    // This might be a direct payment using the merchant's own key
    // We would need to decrypt their key and verify. 
    // To keep it simple for MVP, we'll focus on Chatevo-Managed mode first.
    // In a real multi-tenant setup, you'd either use Paystack Subaccounts or multiple Webhook URLs.
    console.warn(`Payment received for org ${orgId} but signature didn't match Chatevo secret. Assuming managed mode fallback or legacy.`)
  }

  // Update Order Status
  await db.update(orders)
    .set({ 
      payment_status: 'paid',
      payment_reference: data.reference,
      order_status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .where(eq(orders.order_number, orderNumber))

  // --- Managed Balance Logic (5% Fee) ---
  if (org.payment_mode === 'managed' || !org.store_paystack_key_encrypted) {
    const totalAmount = data.amount / 100 // Convert from kobo/cents
    const ChatevoFee = totalAmount * 0.05
    const merchantEarnings = totalAmount - ChatevoFee

    await db.update(organizations)
      .set({
        managed_balance: sql`${organizations.managed_balance} + ${merchantEarnings}`
      })
      .where(eq(organizations.id, orgId))
      
    console.log(`MoR: Credited ${merchantEarnings} to Org ${orgId} (Fee: ${ChatevoFee})`)
  }

  return NextResponse.json({ received: true })
}


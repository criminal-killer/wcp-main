import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, contacts, orders } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { setCart } from '@/lib/redis'

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, params.slug),
    })
    if (!org) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { items, phone, name, address, notes } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })

    const phoneClean = phone.replace(/\D/g, '')

    // Find or create contact
    let contact = await db.query.contacts.findFirst({
      where: eq(contacts.phone, phoneClean),
    })
    if (!contact) {
      const [newContact] = await db.insert(contacts).values({
        org_id: org.id,
        phone: phoneClean,
        name: name || phoneClean,
      }).returning()
      contact = newContact
    } else if (name && contact.name !== name) {
      await db.update(contacts).set({ name }).where(eq(contacts.id, contact.id))
    }

    // Calculate totals
    const subtotal = items.reduce((s: number, i: any) => s + (i.price || 0) * (i.qty || 1), 0)
    const deliveryFee = org.delivery_fee || 0
    const freeDeliveryAbove = org.free_delivery_above || 0
    const finalDelivery = subtotal >= freeDeliveryAbove ? 0 : deliveryFee
    const total = subtotal + finalDelivery

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Create order
    const [order] = await db.insert(orders).values({
      org_id: org.id,
      contact_id: contact.id,
      order_number: orderNumber,
      items: JSON.stringify(items.map((i: any) => ({
        product_id: i.id,
        product_name: i.name,
        price: i.price,
        qty: i.qty,
        variant: i.variant,
      }))),
      subtotal,
      delivery_fee: finalDelivery,
      total,
      currency: org.currency || 'KES',
      payment_status: 'pending',
      order_status: 'new',
      delivery_address: address || null,
      notes: notes || null,
    }).returning()

    // Save cart to Redis for WhatsApp sharing
    const redisCart = items.map((i: any) => ({
      product_id: i.id,
      product_name: i.name,
      price: i.price,
      qty: i.qty,
      variant: i.variant,
    }))
    await setCart(org.id, phoneClean, redisCart)

    // Update contact stats
    await db.update(contacts).set({
      total_orders: (contact.total_orders || 0) + 1,
      total_spent: (contact.total_spent || 0) + total,
      last_order_at: new Date().toISOString(),
    }).where(eq(contacts.id, contact.id))

    // Build WhatsApp link
    const waPhone = org.wa_phone_number_id?.replace(/\D/g, '') || ''
    const message = encodeURIComponent(
      `Hi! I've placed an order *${orderNumber}* for *${org.currency || 'KES'} ${total.toLocaleString()}*. I'm ready to complete payment.`
    )
    const whatsappLink = waPhone ? `https://wa.me/${waPhone}?text=${message}` : ''

    return NextResponse.json({
      orderNumber,
      total,
      currency: org.currency || 'KES',
      whatsappLink,
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PUT(req: Request) {
  const { userId } = auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await req.json()
    const { delivery_fee, delivery_zones, enabled_features, store_mpesa_till, store_bank_details } = body

    await db.update(organizations)
      .set({
        delivery_fee: parseFloat(delivery_fee) || 0,
        delivery_zones,
        enabled_features,
        store_mpesa_till,
        store_bank_details,
      })
      .where(eq(organizations.user_id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SETTINGS_FULFILLMENT_PUT]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

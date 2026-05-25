export const dynamic = "force-dynamic"

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { encrypt } from '@/lib/encryption'
import { logError, categorizeError } from '@/lib/error-logger'

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json() as {
      paystack_key?: string
      paypal_email?: string
      cod_enabled?: boolean
      delivery_fee?: number
    }

    const update: Partial<typeof organizations.$inferInsert> = { updated_at: new Date().toISOString() }
    if (body.paystack_key) update.store_paystack_key_encrypted = encrypt(body.paystack_key)
    if (body.paypal_email !== undefined) update.store_paypal_email = body.paypal_email
    if (body.cod_enabled !== undefined) update.store_cod_enabled = body.cod_enabled ? 1 : 0
    if (body.delivery_fee !== undefined) update.delivery_fee = body.delivery_fee

    const [org] = await db.update(organizations).set(update).where(eq(organizations.id, user.org_id)).returning()
    return NextResponse.json({ message: 'Payment settings saved' })
  } catch (error) {
    console.error('[settings/payments]', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

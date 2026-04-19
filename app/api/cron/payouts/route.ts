import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, payouts } from '@/lib/schema'
import { eq, gt, sql } from 'drizzle-orm'
import { initiatePaystackTransfer } from '@/lib/payments'

export async function GET(req: NextRequest) {
  // Security: Check for CRON_SECRET to prevent manual triggers if needed
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Find all organizations with a balance above 500 (minimum payout threshold)
    // and who are in 'managed' payment mode.
    const eligibleOrgs = await db.query.organizations.findMany({
      where: gt(organizations.managed_balance, 500)
    })

    const results = []

    for (const org of eligibleOrgs) {
      if (!org.managed_payout_details) {
        console.warn(`Org ${org.id} has balance but no payout details set.`)
        continue
      }

      // payout_details should ideally contain the Paystack recipient_code
      // Example: "RCP_xxxxxxxxxxxx"
      const recipientCode = org.managed_payout_details

      const amountToPay = Math.floor(org.managed_balance)
      const amountInKobo = amountToPay * 100

      try {
        const transfer = await initiatePaystackTransfer({
          amount: amountInKobo,
          recipient: recipientCode,
          reason: `Chatevo Payout for ${org.name}`,
          reference: `PO-${org.id.slice(0, 8)}-${Date.now()}`
        })

        if (transfer) {
          // 2. Decrement balance and record payout
          await db.transaction(async (tx) => {
            await tx.update(organizations)
              .set({ managed_balance: sql`${organizations.managed_balance} - ${amountToPay}` })
              .where(eq(organizations.id, org.id))

            await tx.insert(payouts).values({
              org_id: org.id,
              amount: amountToPay,
              currency: org.managed_currency || 'KES',
              status: 'scheduled',
              method: 'paystack',
              reference: transfer.transfer_code,
            })
          })

          results.push({ org: org.name, status: 'success', amount: amountToPay })
        }
      } catch (err) {
        console.error(`Failed payout for ${org.name}:`, err)
        results.push({ org: org.name, status: 'failed', error: String(err) })
      }
    }

    return NextResponse.json({ processed: eligibleOrgs.length, results })
  } catch (error) {
    console.error('Payout cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


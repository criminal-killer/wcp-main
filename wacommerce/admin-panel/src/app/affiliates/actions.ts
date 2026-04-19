'use server'

import { db } from "@/lib/db"
import { affiliates, affiliate_payouts, audit_logs } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"

export async function approveAffiliate(id: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    await db.update(affiliates)
      .set({ status: 'approved' })
      .where(eq(affiliates.id, id))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "APPROVE_AFFILIATE",
      target_type: "affiliate",
      target_id: id,
      details: "Approved affiliate account",
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function rejectAffiliate(id: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    await db.update(affiliates)
      .set({ status: 'rejected' })
      .where(eq(affiliates.id, id))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "REJECT_AFFILIATE",
      target_type: "affiliate",
      target_id: id,
      details: "Rejected affiliate account",
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function processPayout(id: string, amount: number) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    // 1. Fetch current balance to ensure valid
    const affiliate = await db.query.affiliates.findFirst({
      where: (aff, { eq }) => eq(aff.id, id)
    })
    
    if (!affiliate || affiliate.balance < amount) {
      return { success: false, error: "Insufficient balance or invalid affiliate" }
    }

    // 2. Reduce their balance
    await db.update(affiliates)
      .set({ balance: sql`${affiliates.balance} - ${amount}` })
      .where(eq(affiliates.id, id))

    // 3. Insert Payout Record
    await db.insert(affiliate_payouts).values({
      affiliate_id: id,
      amount: amount,
      status: 'paid', // Immediately marking as paid for now
      notes: "Admin manual payout processed",
      processed_at: new Date().toISOString()
    })

    // 4. Log Audit
    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "PROCESS_PAYOUT",
      target_type: "affiliate",
      target_id: id,
      details: `Paid $${amount} to affiliate`,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

'use server'

import { db } from "@/lib/db"
import { support_tickets, audit_logs } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"

export async function getTicket(id: string) {
  return await db.query.support_tickets.findFirst({
    where: eq(support_tickets.id, id)
  })
}

export async function updateTicketStatus(id: string, status: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    await db.update(support_tickets)
      .set({ status, updated_at: new Date().toISOString() })
      .where(eq(support_tickets.id, id))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "UPDATE_TICKET_STATUS",
      target_type: "support_ticket",
      target_id: id,
      details: `Changed ticket status to ${status}`,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteTicket(id: string) {
  const admin = await currentUser()
  if (!admin) return { error: "Unauthorized" }

  try {
    await db.delete(support_tickets).where(eq(support_tickets.id, id))

    await db.insert(audit_logs).values({
      admin_id: admin.id,
      admin_name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      action: "DELETE_TICKET",
      target_type: "support_ticket",
      target_id: id,
      details: "Deleted support ticket",
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
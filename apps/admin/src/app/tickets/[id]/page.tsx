import { db } from "@/lib/db"
import { support_tickets, users, organizations } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { TicketClient } from "../ticket-client"

export const dynamic = "force-dynamic"

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  let ticket: any = null

  try {
    const rows = await db.select({
      id: support_tickets.id,
      subject: support_tickets.subject,
      description: support_tickets.description,
      status: support_tickets.status,
      type: support_tickets.type,
      created_at: support_tickets.created_at,
      org_id: support_tickets.org_id,
      user_id: support_tickets.user_id,
    })
    .from(support_tickets)
    .where(eq(support_tickets.id, params.id))
    .limit(1)

    if (rows.length > 0) {
      ticket = rows[0]
    }
  } catch (err) {
    console.error("Error fetching ticket:", err)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <TicketClient initialTicket={ticket} />
    </div>
  )
}
import { db } from "@/lib/db"
import { support_tickets, users, organizations } from "@/lib/schema"
import { desc, eq } from "drizzle-orm"
import TicketsClient from "./tickets-client"

type Ticket = {
  id: string
  subject: string
  description: string | null
  status: string | null
  type: string | null
  created_at: string | null
  user_name: string | null
  user_email: string | null
  org_name: string | null
}

export default async function TicketsPage() {
  let ticketsList: Ticket[] = []

  try {
    const rows = await db.select({
      id: support_tickets.id,
      subject: support_tickets.subject,
      description: support_tickets.description,
      status: support_tickets.status,
      type: support_tickets.type,
      created_at: support_tickets.created_at,
      user_name: users.name,
      user_email: users.email,
      org_name: organizations.name
    })
    .from(support_tickets)
    .leftJoin(users, eq(support_tickets.user_id, users.id))
    .leftJoin(organizations, eq(support_tickets.org_id, organizations.id))
    .orderBy(desc(support_tickets.created_at))
    .limit(100)

    ticketsList = rows.map(r => ({
      ...r,
      user_name: r.user_name ?? null,
      user_email: r.user_email ?? null,
      org_name: r.org_name ?? null,
    }))
  } catch (err) {
    console.error("Error fetching tickets:", err)
  }

  return <TicketsClient initialData={ticketsList} />
}

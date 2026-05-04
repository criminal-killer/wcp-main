import { db } from "@/lib/db"
import { affiliate_payouts, affiliates } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"
import { PayoutsClient } from "./payouts-client"

export const dynamic = "force-dynamic"

export default async function AdminPayoutsPage() {
  let data: {
    id: string
    amount: number
    status: string
    notes: string | null
    created_at: string | null
    processed_at: string | null
    affiliate_id: string
    affiliate_name: string
    affiliate_email: string
    affiliate_payment_details: string | null
    affiliate_balance: number
  }[] = []

  try {
    const rows = await db
      .select({
        id: affiliate_payouts.id,
        amount: affiliate_payouts.amount,
        status: affiliate_payouts.status,
        notes: affiliate_payouts.notes,
        created_at: affiliate_payouts.created_at,
        processed_at: affiliate_payouts.processed_at,
        affiliate_id: affiliates.id,
        affiliate_name: affiliates.name,
        affiliate_email: affiliates.email,
        affiliate_payment_details: affiliates.payment_details,
        affiliate_balance: affiliates.balance,
      })
      .from(affiliate_payouts)
      .innerJoin(affiliates, eq(affiliate_payouts.affiliate_id, affiliates.id))
      .orderBy(desc(affiliate_payouts.created_at))
      .limit(200)

    data = rows.map(r => ({
      ...r,
      affiliate_balance: r.affiliate_balance ?? 0,
      status: r.status ?? "pending",
    }))
  } catch (err) {
    console.error("Error fetching payout requests:", err)
  }

  return <PayoutsClient initialData={data} />
}

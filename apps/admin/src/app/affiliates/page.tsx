import { db } from "@/lib/db"
import { affiliates } from "@/lib/schema"
import { desc } from "drizzle-orm"
import { AffiliatesClient } from "./affiliates-client"

export default async function AdminAffiliatesPage() {
  let data: any[] = []
  
  try {
    data = await db.select({
      id: affiliates.id,
      name: affiliates.name,
      email: affiliates.email,
      phone: affiliates.phone,
      status: affiliates.status,
      terms_accepted: affiliates.terms_accepted,
      balance: affiliates.balance,
    })
    .from(affiliates)
    .orderBy(desc(affiliates.created_at))
    .limit(500)
  } catch (err) {
    console.error("Error fetching affiliates:", err)
  }

  return <AffiliatesClient initialData={data} />
}

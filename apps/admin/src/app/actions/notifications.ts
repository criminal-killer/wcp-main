'use server'

import { db } from "@/lib/db"
import { notifications } from "@/lib/schema"

export async function sendNotification(data: {
  title: string
  message: string
  type: string
  targetOrgId?: string
}) {
  try {
    if (!data.targetOrgId) {
      // Broadcast to ALL users
      // In a robust system we might want to map across all orgs,
      // but if the UI is rendering a general notification it might 
      // insert a single abstract row or insert multiple.
      // Wait, the schema has org_id as required: `org_id: text('org_id').notNull().references(() => organizations.id)`
      // So we have to fetch all orgs and insert for each org if it's a bulk broadcast!
      
      const { organizations } = await import("@/lib/schema");
      const orgs = await db.select({ id: organizations.id }).from(organizations);
      
      if (orgs.length === 0) return { success: true };
      
      const inserts = orgs.map(org => ({
        org_id: org.id,
        title: data.title,
        message: data.message,
        type: data.type,
        is_read: 0
      }));
      
      // Batch insert (SQLite can efficiently do this unless too many rows, but safe enough here)
      await db.insert(notifications).values(inserts);
      
    } else {
      // Single org
      await db.insert(notifications).values({
        org_id: data.targetOrgId,
        title: data.title,
        message: data.message,
        type: data.type,
        is_read: 0
      });
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to send notification:", error)
    return { success: false, error: error.message }
  }
}

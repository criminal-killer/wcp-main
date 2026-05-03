import { db } from "./db";
import { audit_logs } from "./schema";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Logs an administrative action to the database.
 */
export async function logAction({
  action,
  targetType,
  targetId,
  details
}: {
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
}) {
  try {
    const user = await currentUser();
    if (!user) return;

    await db.insert(audit_logs).values({
      admin_id: user.id,
      admin_name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}

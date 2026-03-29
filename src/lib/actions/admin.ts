'use server'
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAction } from "../audit";
import { auth, currentUser } from "@clerk/nextjs/server";

const SUPER_ADMIN_ID = process.env.ADMIN_USER_ID;

async function checkSuperAdmin() {
  const { userId } = auth();
  if (!userId || userId !== SUPER_ADMIN_ID) {
    throw new Error("Unauthorized: SuperAdmin access required");
  }
}

export async function approveUser(userId: string, role: string) {
  await checkSuperAdmin();

  await db.update(users)
    .set({ is_active: 1, role })
    .where(eq(users.id, userId));

  await logAction({
    action: "APPROVE_USER",
    targetType: "user",
    targetId: userId,
    details: { role }
  });

  revalidatePath('/team');
}

export async function updateUserRole(userId: string, role: string) {
  await checkSuperAdmin();

  await db.update(users)
    .set({ role })
    .where(eq(users.id, userId));

  await logAction({
    action: "UPDATE_USER_ROLE",
    targetType: "user",
    targetId: userId,
    details: { role }
  });

  revalidatePath('/team');
}

export async function restrictUser(userId: string) {
  await checkSuperAdmin();

  await db.update(users)
    .set({ is_active: 0 })
    .where(eq(users.id, userId));

  await logAction({
    action: "RESTRICT_USER",
    targetType: "user",
    targetId: userId
  });

  revalidatePath('/team');
}

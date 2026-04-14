'use server';

import { db } from '@/db';
import { marketingPosts, leads } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * FIXED TIME SCHEDULING LOGIC: 
 * Set to 9:00 AM the following day.
 */
function getNextDayNineAM() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.getTime();
}

export async function approvePost(id: string) {
  const scheduledAt = getNextDayNineAM();
  
  await db.update(marketingPosts)
    .set({ 
      status: 'APPROVED', 
      approvedAt: Date.now(),
      scheduledAt: scheduledAt
    })
    .where(eq(marketingPosts.id, id));
  
  revalidatePath('/dashboard/posts');
}

export async function redoPost(id: string) {
  await db.update(marketingPosts)
    .set({ status: 'REDO' })
    .where(eq(marketingPosts.id, id));
  
  revalidatePath('/dashboard/posts');
}

export async function approveLead(id: string) {
  await db.update(leads)
    .set({ status: 'APPROVED' })
    .where(eq(leads.id, id));
    
  revalidatePath('/dashboard/leads');
}

export async function rejectLead(id: string) {
  await db.update(leads)
    .set({ status: 'REJECTED' })
    .where(eq(leads.id, id));
    
  revalidatePath('/dashboard/leads');
}

/** 
 * THE JANITOR: 4-Day Auto-Cleanup Logic
 * Permanently deletes records older than 4 days.
 */
export async function runJanitor() {
  const fourDaysAgo = Date.now() - (4 * 24 * 60 * 60 * 1000);
  
  await db.delete(marketingPosts).where(lte(marketingPosts.createdAt, fourDaysAgo));
  await db.delete(leads).where(lte(leads.createdAt, fourDaysAgo));
  
  console.log('Janitor: Cleanup complete.');
}

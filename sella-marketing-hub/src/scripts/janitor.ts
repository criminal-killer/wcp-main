import { db } from '../db';
import { marketingPosts, leads } from '../db/schema';
import { lte } from 'drizzle-orm';

/**
 * THE JANITOR: 4-Day Auto-Cleanup Logic
 * Permanently deletes records older than 4 days.
 */
async function runJanitor() {
  console.log('Janitor: Starting cleanup...');
  const fourDaysAgo = Date.now() - (4 * 24 * 60 * 60 * 1000);
  
  try {
    const deletedPosts = await db.delete(marketingPosts).where(lte(marketingPosts.createdAt, fourDaysAgo));
    const deletedLeads = await db.delete(leads).where(lte(leads.createdAt, fourDaysAgo));
    
    console.log(`Janitor: Cleanup complete. Records deleted from posts and leads.`);
  } catch (error) {
    console.error('Janitor: Error during cleanup:', error);
    process.exit(1);
  }
}

runJanitor();

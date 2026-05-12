/**
 * Store Context Utility
 * Server-side helpers for resolving and managing the active store
 */
import { db } from './db'
import { users, stores } from './schema'
import { eq, and } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'

export type ActiveStore = InferSelectModel<typeof stores>

/**
 * Get the active store for a user
 * Returns the store the user has selected, or their default store
 */
export async function getActiveStore(clerkId: string): Promise<ActiveStore | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.clerk_id, clerkId),
  })

  if (!user) return null

  // If user has an active store set, use it
  if (user.active_store_id) {
    const store = await db.query.stores.findFirst({
      where: and(
        eq(stores.id, user.active_store_id),
        eq(stores.is_active, 1)
      ),
    })
    if (store) return store
  }

  // Fall back to default store
  const defaultStore = await db.query.stores.findFirst({
    where: and(
      eq(stores.org_id, user.org_id!),
      eq(stores.is_default, 1),
      eq(stores.is_active, 1)
    ),
  })
  if (defaultStore) return defaultStore

  // Fall back to first store
  const firstStore = await db.query.stores.findFirst({
    where: and(
      eq(stores.org_id, user.org_id!),
      eq(stores.is_active, 1)
    ),
    orderBy: (stores, { asc }) => [asc(stores.created_at)],
  })

  return firstStore || null
}

/**
 * Set the active store for a user
 */
export async function setActiveStore(userId: string, storeId: string): Promise<boolean> {
  await db.update(users)
    .set({ active_store_id: storeId })
    .where(eq(users.id, userId))
  return true
}

/**
 * Get a store by ID (for API routes)
 */
export async function getStoreById(storeId: string, orgId: string): Promise<ActiveStore | null> {
  const store = await db.query.stores.findFirst({
    where: and(
      eq(stores.id, storeId),
      eq(stores.org_id, orgId),
      eq(stores.is_active, 1)
    ),
  })
  return store || null
}

/**
 * Get a store by slug (for public pages)
 */
export async function getStoreBySlug(slug: string): Promise<ActiveStore | null> {
  const store = await db.query.stores.findFirst({
    where: and(
      eq(stores.slug, slug),
      eq(stores.is_active, 1),
      eq(stores.is_live, 1) // Only return live/launched stores
    ),
  })
  return store || null
}

/**
 * Launch a store (set is_live = 1)
 */
export async function launchStore(storeId: string, orgId: string): Promise<boolean> {
  await db.update(stores)
    .set({ is_live: 1, updated_at: new Date().toISOString() })
    .where(and(eq(stores.id, storeId), eq(stores.org_id, orgId)))
  return true
}

/**
 * Unlaunch a store (set is_live = 0)
 */
export async function unlaunchStore(storeId: string, orgId: string): Promise<boolean> {
  await db.update(stores)
    .set({ is_live: 0, updated_at: new Date().toISOString() })
    .where(and(eq(stores.id, storeId), eq(stores.org_id, orgId)))
  return true
}

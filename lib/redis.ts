import { Redis } from '@upstash/redis'

const isConfigured = 
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'https://...') ||
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== '');

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = isConfigured && url && token
  ? new Redis({
      url: url,
      token: token,
    })
  : null

// Helper to wrap redis calls
async function exec<T>(fn: (r: Redis) => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback
  try {
    return await fn(redis)
  } catch (err) {
    console.error('Redis error:', err)
    return fallback
  }
}

// Rate limiting helper
export async function rateLimit(key: string, limit: number, window: number): Promise<boolean> {
  return await exec(async (r) => {
    const current = await r.incr(key)
    if (current === 1) {
      await r.expire(key, window)
    }
    return current <= limit
  }, true)
}

// Cart helpers
export async function getCart(orgId: string, phone: string) {
  return await exec(async (r) => {
    const key = `sella:cart:${orgId}:${phone}`
    return await r.get(key)
  }, null)
}

export async function setCart(orgId: string, phone: string, cart: unknown) {
  const key = `sella:cart:${orgId}:${phone}`
  await exec(async (r) => {
    await r.setex(key, 86400, JSON.stringify(cart)) // 24 hour TTL
  }, null)
}

// Flow state helpers (WhatsApp store engine)
export async function getFlowState(orgId: string, phone: string) {
  return await exec(async (r) => {
    const key = `sella:flow:${orgId}:${phone}`
    return await r.get<Record<string, unknown>>(key)
  }, null)
}

export async function setFlowState(orgId: string, phone: string, state: Record<string, unknown>) {
  const key = `sella:flow:${orgId}:${phone}`
  await exec(async (r) => {
    await r.setex(key, 1800, JSON.stringify(state)) // 30 min TTL
  }, null)
}

export async function clearFlowState(orgId: string, phone: string) {
  const key = `sella:flow:${orgId}:${phone}`
  await exec(async (r) => {
    await r.del(key)
  }, null)
}

export const deleteFlowState = clearFlowState

export async function clearCart(orgId: string, phone: string) {
  const key = `sella:cart:${orgId}:${phone}`
  await exec(async (r) => {
    await r.del(key)
  }, null)
}

// Product cache helpers
export async function getCachedProducts(orgId: string) {
  return await exec(async (r) => {
    const key = `sella:products:${orgId}`
    return await r.get(key)
  }, null)
}

export async function setCachedProducts(orgId: string, products: unknown) {
  const key = `sella:products:${orgId}`
  await exec(async (r) => {
    await r.setex(key, 300, JSON.stringify(products)) // 5 min TTL
  }, null)
}

export async function clearProductCache(orgId: string) {
  const key = `sella:products:${orgId}`
  await exec(async (r) => {
    await r.del(key)
  }, null)
}

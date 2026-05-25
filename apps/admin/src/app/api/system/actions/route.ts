import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, errorLogs, organizations } from '@/lib/schema'
import { eq, and, lt, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!admin || !admin.is_super_admin) return NextResponse.json({ error: 'Super admin required' }, { status: 403 })

    const body = await req.json() as { action: string }
    if (!body.action) return NextResponse.json({ error: 'action required' }, { status: 400 })

    switch (body.action) {
      case 'clear_cache': {
        // Flush Upstash Redis keys matching Chatevo:*
        const redisUrl = process.env.KV_REST_API_URL
        const redisToken = process.env.KV_REST_API_TOKEN
        if (!redisUrl || !redisToken) {
          return NextResponse.json({ success: false, message: 'Redis not configured' })
        }
        try {
          // Use SCAN to find and delete Chatevo:* keys
          let cursor = '0'
          let deletedCount = 0
          do {
            const scanRes = await fetch(`${redisUrl}/scan/${cursor}/match/Chatevo:*/count/100`, {
              headers: { Authorization: `Bearer ${redisToken}` },
            })
            const scanData = await scanRes.json()
            cursor = String(scanData.result?.[0] || '0')
            const keys: string[] = scanData.result?.[1] || []
            if (keys.length > 0) {
              for (const key of keys) {
                await fetch(`${redisUrl}/del/${key}`, {
                  headers: { Authorization: `Bearer ${redisToken}` },
                })
                deletedCount++
              }
            }
          } while (cursor !== '0')
          return NextResponse.json({ success: true, message: `Cleared ${deletedCount} cache keys` })
        } catch (err) {
          return NextResponse.json({ success: false, message: 'Failed to clear cache' })
        }
      }

      case 'flush_logs': {
        // Delete resolved error logs older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const result = await db.delete(errorLogs)
          .where(and(
            eq(errorLogs.status, 'fixed'),
            lt(errorLogs.created_at, thirtyDaysAgo)
          ))
        return NextResponse.json({ success: true, message: 'Flushed resolved error logs older than 30 days' })
      }

      case 'panic_mode': {
        // Toggle panic mode — disable all store checkouts by setting is_active = 0 for all orgs
        // This is dangerous — we'll add a panic_mode flag instead
        const url = new URL(req.url)
        const enable = url.searchParams.get('enable') === 'true'
        if (enable) {
          await db.update(organizations).set({ is_active: 0, updated_at: new Date().toISOString() })
          return NextResponse.json({ success: true, message: 'PANIC MODE: All stores disabled' })
        } else {
          await db.update(organizations).set({ is_active: 1, updated_at: new Date().toISOString() })
          return NextResponse.json({ success: true, message: 'Panic mode deactivated: All stores re-enabled' })
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[admin/system/actions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, subscriptions } from '@/lib/schema'
import { eq, lt, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Find orgs with expired trials still on trial plan
  const expiredTrials = await db.select()
    .from(organizations)
    .where(
      and(
        eq(organizations.plan, 'trial'),
        lt(organizations.trial_ends_at, now),
      )
    )

  let downgraded = 0
  for (const org of expiredTrials) {
    await db.update(organizations)
      .set({ plan: 'free', updated_at: now })
      .where(eq(organizations.id, org.id))
    downgraded++
    console.log(`[CRON] Trial expired for org ${org.id} (${org.name})`)
  }

  return NextResponse.json({
    message: `Processed ${expiredTrials.length} expired trials. Downgraded: ${downgraded}`,
    downgraded,
  })
}

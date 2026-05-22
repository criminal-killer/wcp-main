import { db } from '@/lib/db'
import { errorLogs, organizations } from '@/lib/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { ErrorLogCard } from './error-card'

export const dynamic = 'force-dynamic'

export default async function ErrorLogsPage() {
  let logs: any[] = []
  let stats = { total: 0, open: 0 }
  let tableMissing = false

  try {
    const result = await db.select({
      id: errorLogs.id,
      org_id: errorLogs.org_id,
      severity: errorLogs.severity,
      category: errorLogs.category,
      message: errorLogs.message,
      cause: errorLogs.cause,
      fix: errorLogs.fix,
      stack: errorLogs.stack,
      status: errorLogs.status,
      created_at: errorLogs.created_at,
      updated_at: errorLogs.updated_at,
      org_name: organizations.name,
      org_slug: organizations.slug,
    })
      .from(errorLogs)
      .leftJoin(organizations, eq(errorLogs.org_id, organizations.id))
      .orderBy(
        sql`CASE WHEN ${errorLogs.severity} = 'high' THEN 0 ELSE 1 END`,
        desc(errorLogs.created_at)
      )
      .limit(100)

    logs = result

    const countResult = await db.select({
      total: sql<number>`count(*)`,
      open: sql<number>`sum(case when ${errorLogs.status} = 'open' then 1 else 0 end)`,
    }).from(errorLogs)

    stats = { total: Number(countResult[0]?.total || 0), open: Number(countResult[0]?.open || 0) }
  } catch (err: any) {
    console.error('Error fetching error logs:', err)
    if (err.message?.includes('no such table')) tableMissing = true
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-red-500" />
            Error Logs
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {stats.open} open errors · {stats.total} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {stats.open} open
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500" /> {stats.total - stats.open} resolved
          </div>
        </div>
      </div>

      {tableMissing ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center">
          <p className="text-amber-800 font-bold text-lg">Table not found</p>
          <p className="text-amber-600 text-sm mt-2">Run the migration script to create the error_logs table.</p>
          <code className="block mt-4 text-xs bg-amber-100 px-4 py-2 rounded-lg">npx tsx apps/merchant/scripts/migrate-error-logs.ts</code>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-lg font-black text-slate-400">No errors logged</p>
          <p className="text-sm font-semibold text-slate-400 mt-1">All systems running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <ErrorLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

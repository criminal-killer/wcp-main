# ⚠️ MOVED — Admin Panel

This directory previously contained the Chatevo Admin Panel.

## New canonical location

**`apps/admin/`** — this is now the single source of truth for the admin app.

| What | Where |
|------|-------|
| Next.js source | `apps/admin/src/` |
| Configs | `apps/admin/next.config.mjs`, `apps/admin/tsconfig.json` |
| DB client | `apps/admin/src/lib/db.ts` |
| Schema | `apps/admin/src/lib/schema.ts` |

## Running the admin app

```bash
npm run dev:admin    # from repo root
```

## Vercel deployment

Set **Root Directory = `apps/admin`** in Vercel project settings.

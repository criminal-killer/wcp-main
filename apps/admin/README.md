# apps/admin

This is the **canonical Chatevo Admin Panel** workspace entry.

The actual Next.js application source lives at  
`../../wacommerce/admin-panel/`.  
This package.json exists so npm workspaces can address this app as `@chatevo/admin`.

## Running this app directly

```bash
# From repo root
npm run dev:admin

# Or directly from the admin source
cd ../../wacommerce/admin-panel && npm run dev
```

## Vercel Deployment

Set **Root Directory** to `wacommerce/admin-panel` in the Vercel project settings.

## Source locations

| What | Where |
|------|-------|
| Next.js pages | `../../wacommerce/admin-panel/src/app/` |
| API routes | `../../wacommerce/admin-panel/src/app/api/` |
| DB client | `../../wacommerce/admin-panel/src/lib/db.ts` |
| Schema | `../../wacommerce/admin-panel/src/lib/schema.ts` |
| Middleware | `../../wacommerce/admin-panel/src/middleware.ts` |

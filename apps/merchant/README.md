# apps/merchant

This is the **canonical Chatevo Merchant App** workspace entry.

The actual Next.js application source lives at the **repository root** (`../../`).  
This package.json exists so npm workspaces and tooling can address this app as  
`@chatevo/merchant` and run root-level scripts like `npm run dev:merchant`.

## Running this app directly

```bash
# From repo root
npm run dev:merchant

# Or from this directory (runs next dev at repo root)
cd ../../ && npm run dev
```

## Vercel Deployment

Set **Root Directory** to `.` (repo root) in the Vercel project settings for this app.

## Source locations

| What | Where |
|------|-------|
| Next.js pages | `../../app/` |
| API routes | `../../app/api/` |
| UI components | `../../components/` |
| Business logic | `../../lib/` |
| DB schema | `../../lib/schema.ts` (mirrors `packages/db/src/schema.ts`) |
| Config | `../../next.config.js`, `../../tailwind.config.ts` |

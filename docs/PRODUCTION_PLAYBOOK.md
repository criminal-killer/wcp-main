# CHATEVO Production Transformation Playbook

This is the execution checklist to move CHATEVO from MVP → production-grade.
Priority order: Stability → Security → Correctness → Performance → UX.

## System Map (Source of Truth)
- Repo: wcp-main (monorepo + marketing workflows)
- Separate deploy repos:
  - adm-pan (admin panel)
  - Phase-2-app (merchant app)
- Shared services:
  - Auth: Clerk
  - DB: Turso/LibSQL via Drizzle ORM
  - Cache/ratelimit capability: Upstash Redis

## Non-negotiables
- No breaking changes without a rollback plan.
- Backend hardening before frontend polish.
- All API filtering/sorting/pagination is server-side.
- Whitelist sorting fields. No raw request spreading.
- Validate inputs (Zod) on every write endpoint.
- No secrets in docs or committed examples.

---

## Phase 0 — Repo Hygiene & Guardrails (DevOps)
- [ ] Add this playbook (done when file has content)
- [ ] CI checks per repo: lint + typecheck + build
- [ ] Branch protection: PR required + checks required
- [ ] Automate monorepo → split repos sync (admin + phase2)
- [ ] Secret scan pass: ensure no live keys in docs/examples
- [ ] Add CODEOWNERS for sensitive areas (webhooks, billing, auth, db)

## Phase 1 — API Hardening (Stability/Security)
- [ ] Standard API error handler (consistent JSON; no stack leaks)
- [ ] Add try/catch for all route handlers performing I/O
- [ ] Input validation for every API route (Zod)
- [ ] Server-side authz: org-scoped data access everywhere
- [ ] Rate limiting for public + auth endpoints (Upstash)
- [ ] Structured logging + request correlation IDs

## Phase 2 — Security Baseline
- [ ] Security headers via Next.js headers() (CSP, frame-ancestors, etc.)
- [ ] Webhook signature verification audit (Stripe/Paystack/Meta)
- [ ] Explicit CORS policy for any cross-origin endpoints
- [ ] Token/session handling audit (Clerk usage correctness)

## Phase 3 — Database Reliability
- [ ] Index audit: all FK columns + common query patterns
- [ ] Migration discipline (drizzle-kit workflow documented)
- [ ] Backup/restore procedure documented

## Phase 4 — Observability & Ops
- [ ] Health endpoints
- [ ] Cron monitoring (failure visibility + alerting approach)
- [ ] Minimal error reporting pipeline (free-first)

## Phase 5 — Growth UX (after safety)
- [ ] Landing page modernization plan (smooth animation/3D)
- [ ] Marketing control panel (view runs, trigger workflows, CRUD)
- [ ] Referral dashboard GA + payout tracking
# Security & Compliance
# SELLA

---

## 1. Authentication & Authorization

| Layer | Implementation |
|-------|---------------|
| Auth provider | Clerk (enterprise-grade) |
| Session management | JWT + httpOnly cookies |
| Password policy | Clerk defaults (min 8 chars) |
| MFA | Available via Clerk (user opt-in) |
| Social login | Google, Apple, Facebook |
| Route protection | Clerk middleware on all `/dashboard` and `/admin` routes |
| Admin protection | `ADMIN_USER_ID` env var check |
| Multi-tenant | `org_id` from Clerk session on every request |

---

## 2. Data Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| WhatsApp access tokens | AES-256 encrypted | HTTPS/TLS |
| Payment API keys | AES-256 encrypted | HTTPS/TLS |
| Passwords | Clerk (bcrypt + salt) | HTTPS/TLS |
| Database | Turso encryption at rest | HTTPS/TLS |
| All API traffic | — | HTTPS (Vercel auto-SSL) |

### Encryption Implementation
```typescript
// lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0,32))

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decrypt(encrypted: string): string {
  const [ivHex, data] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  let decrypted = decipher.update(data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

## 3. Multi-Tenant Isolation
**Rule:** Store owner A can NEVER see Store owner B's data.

**Implementation:**
- Every DB table has `org_id` column
- Every query includes `WHERE org_id = ?`
- `org_id` comes from Clerk session (server-side), NEVER from client
- API routes reject requests where user doesn't belong to org
- No cross-tenant queries exist in codebase

## 4. API Security
| Protection | Implementation |
|------------|----------------|
| Rate limiting | Upstash Redis (per-org, per-endpoint) |
| Input validation | Zod schemas on all endpoints |
| SQL injection | Drizzle ORM parameterized queries |
| XSS | React auto-escaping + sanitization |
| CSRF | Clerk session tokens (SameSite cookies) |
| CORS | Next.js config (app domain only) |
| Webhook verification | Signature checks (Meta, Paystack, Stripe) |

## 5. Webhook Security
- **Meta WhatsApp Webhook:** Verify `X-Hub-Signature-256` header. Compare HMAC-SHA256 of body with app secret.
- **Paystack Webhook:** Verify `x-paystack-signature` header. Compare HMAC-SHA512 of body with secret key.
- **Stripe Webhook:** Verify `stripe-signature` header. Use `stripe.webhooks.constructEvent()`.

## 6. Data Privacy
- User data stored in Turso (encrypted at rest)
- No data sold to third parties
- Users can request data export (admin action)
- Users can request account deletion (admin action)
- WhatsApp message content stored for inbox functionality
- Payment data: only references stored (no card numbers)

## 7. Meta/WhatsApp Compliance
- Comply with Meta's Business Messaging Policy
- No spam: messages only to opted-in customers
- Respect 24-hour messaging window
- Template messages submitted for Meta approval
- Business verification required for production access

## 8. Environment Security
- All secrets in environment variables (never in code)
- `.env.local` in `.gitignore` (never committed)
- Different keys for development and production
- Vercel environment variables encrypted at rest
- Rotate keys quarterly (calendar reminder)

# Production Setup Guide — chatsevo.com

> Last updated: 2026-05-18

---

## 1. DNS Status for chatsevo.com

**Registrar / DNS Provider:** Namecheap (`dns1.registrar-servers.com` / `dns2.registrar-servers.com`)

All 5 required Clerk DNS CNAME records have been verified as correctly propagated:

| Host | Target | Status |
|------|--------|--------|
| `accounts.chatsevo.com` | `accounts.clerk.services` | ✅ Verified |
| `clerk.chatsevo.com` | `frontend-api.clerk.services` | ✅ Verified |
| `clkmail.chatsevo.com` | `mail.w3ayh74zraep.clerk.services` | ✅ Verified |
| `clk._domainkey.chatsevo.com` | `dkim1.w3ayh74zraep.clerk.services` | ✅ Verified |
| `clk2._domainkey.chatsevo.com` | `dkim2.w3ayh74zraep.clerk.services` | ✅ Verified |

**No DNS records are missing and none point to wrong values.** DNS is fully correct.

> **Note:** Namecheap's DNS UI does not proxy records, so these are already DNS-only (no orange-cloud Cloudflare issue applies).

---

## 2. Remove Developer Mode Banner from Clerk — REQUIRED MANUAL STEPS

The "Development Mode" banner on the signup page is caused by using **test/development Clerk API keys** (`pk_test_...` / `sk_test_...`).

To remove it you must switch to **production Clerk keys**.

### Step 1 — Get Your Production Clerk Keys

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. In the left sidebar, click **"Configure" → "API Keys"**
4. At the top of the page, switch the environment toggle from **"Development"** to **"Production"**
5. Copy the two keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — starts with `pk_live_...`
   - `CLERK_SECRET_KEY` — starts with `sk_live_...`

### Step 2 — Connect Your Production Domain in Clerk

1. In the Clerk dashboard (Production environment), go to **"Configure" → "Domains"**
2. Click **"Add domain"** and enter `chatsevo.com`
3. Clerk will show you DNS records to add — **all 5 of those records are already added and verified** (see Section 1 above)
4. Click **"Verify"** in Clerk — it should pass immediately since DNS is already propagated

### Step 3 — Update Your Environment Variables

Update the following files with your new **production** keys.

#### `wcp-main/.env` and `wcp-main/.env.local`

```env
# OLD (development — causes "Dev Mode" banner):
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bm92ZWwtY2F0ZmlzaC0zMi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_ATpFsFcJNkGSb6WfRhEESeOvFlpufNjYf0YMmCBVl6

# NEW (replace with your actual production keys from Clerk dashboard):
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REPLACE_WITH_YOUR_KEY
CLERK_SECRET_KEY=sk_live_REPLACE_WITH_YOUR_KEY

# Also update:
NEXT_PUBLIC_APP_URL=https://chatsevo.com
```

Also fix the Resend email domain (currently has a typo `chatevo` instead of `chatsevo`):

```env
RESEND_FROM_EMAIL=noreply@chatsevo.com
EMAIL_FROM_DOMAIN=chatsevo.com
```

#### On Vercel (Production Deployment)

> If you are deploying to Vercel, environment variables in `.env.local` are **not** used in production. You must set them in the Vercel dashboard.

1. Go to [https://vercel.com](https://vercel.com) → Your Project → **Settings** → **Environment Variables**
2. Add/update these variables for the **Production** environment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (from Clerk) |
| `CLERK_SECRET_KEY` | `sk_live_...` (from Clerk) |
| `CLERK_WEBHOOK_SECRET` | Get from Clerk → Webhooks |
| `NEXT_PUBLIC_APP_URL` | `https://chatsevo.com` |
| `RESEND_FROM_EMAIL` | `noreply@chatsevo.com` |
| `EMAIL_FROM_DOMAIN` | `chatsevo.com` |

3. After saving, trigger a **Redeploy** in Vercel.

---

## 3. Resend — Verify Your Sending Domain

The app currently has `EMAIL_FROM_DOMAIN=chatevo.io` (wrong domain). You need to verify `chatsevo.com` in Resend:

1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click **"Add Domain"** and enter `chatsevo.com`
3. Resend will give you DNS records to add (typically SPF, DKIM, DMARC TXT records)
4. Add those in Namecheap → Advanced DNS for `chatsevo.com`
5. Click **"Verify"** in Resend

---

## 4. Run Clerk Verification Again

After completing Step 3 of Section 2:

1. Return to Clerk Dashboard → Production → **Domains**
2. Click **"Verify"** next to `chatsevo.com`
3. All records should pass immediately (DNS is already propagated)

---

## 5. Post-Go-Live Checklist

- [ ] Clerk production keys swapped in all env files
- [ ] Vercel env vars updated and redeployed
- [ ] Clerk domain verified in Production mode
- [ ] "Development mode" banner gone from signup page
- [ ] Resend domain `chatsevo.com` verified
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://chatsevo.com`
- [ ] Clerk Webhook URL updated to `https://chatsevo.com/api/webhooks/clerk`
- [ ] Paystack webhook URL updated to `https://chatsevo.com/api/webhooks/paystack`

---

## Summary of What Was Done Automatically vs Manually Required

| Task | Done Automatically | Requires Manual Action |
|------|--------------------|------------------------|
| DNS record verification | ✅ Checked — all 5 correct | — |
| Hardcoded Vercel URLs replaced in code | ✅ Fixed in `page.tsx`, `layout.tsx` | — |
| Email domain typo fixed in env | ✅ Fixed (`chatevo` → `chatsevo.com`) | Update Vercel env vars too |
| `NEXT_PUBLIC_APP_URL` updated | ✅ Fixed in `.env` and `.env.local` | Update Vercel env vars too |
| Switching Clerk to Production mode | Cannot be done (requires Clerk login) | Follow Section 2 above |
| Vercel env var update | Cannot be done (requires Vercel login) | Follow Section 2 Step 3 above |
| Resend domain verification | Cannot be done (requires Resend login + DNS) | Follow Section 3 above |
| Google Search Console verification | Cannot be done (requires Google account) | Follow Section 6 below |

---

## 6. Get Indexed by Google — SEO Setup

Your app already has strong SEO foundations built in:
- ✅ Next.js `Metadata` with title, description, keywords, openGraph, twitter cards
- ✅ JSON-LD structured data (`SoftwareApplication` schema) on the homepage
- ✅ `robots.ts` — correct allow/disallow rules
- ✅ `sitemap.ts` — auto-generated at `/sitemap.xml`
- ✅ Canonical URLs (now fixed to `chatsevo.com`)

**These are the steps required to actually get into Google search results:**

### Step 6.1 — Verify with Google Search Console

1. Go to [https://search.google.com/search-console](https://search.google.com/search-console)
2. Click **"Add property"** → enter `https://chatsevo.com`
3. Choose **"HTML tag"** verification method
4. Copy the verification code — it looks like: `<meta name="google-site-verification" content="YOUR_CODE" />`
5. In `apps/merchant/app/layout.tsx`, replace this line:
   ```ts
   verification: {
     google: 'google-site-verification-code', // ← replace this placeholder
   },
   ```
   With your actual code:
   ```ts
   verification: {
     google: 'YOUR_ACTUAL_CODE_FROM_GOOGLE',
   },
   ```
6. Deploy, then click **"Verify"** in Google Search Console

### Step 6.2 — Submit Your Sitemap to Google

After verifying ownership:

1. In Google Search Console, click **"Sitemaps"** in the left sidebar
2. Enter `https://chatsevo.com/sitemap.xml`
3. Click **"Submit"**

Google will now crawl all public pages: `/`, `/sign-up`, `/sign-in`, `/docs`, `/affiliates/apply`

### Step 6.3 — Create an OG Image (Critical for Click-Through Rate)

The app references `/og-image.jpg` but this file may not exist. Without it, social shares and Google previews look blank.

Create a `1200×630px` image and place it at:
```
apps/merchant/public/og-image.jpg
```

It should show your brand name "Chatevo" with a tagline on a dark/green background. This image appears when someone shares your link on WhatsApp, Twitter, LinkedIn, etc.

### Step 6.4 — Request Indexing Immediately

After deploying:

1. In Google Search Console → **URL Inspection**
2. Enter `https://chatsevo.com`
3. Click **"Request Indexing"**

This fast-tracks your homepage into Google — typically indexed within 24–72 hours instead of weeks.

### Step 6.5 — Disallow Vercel Preview URL (Avoid Duplicate Content)

If your app is also accessible at `chatevo-app.vercel.app`, Google may index both URLs causing a duplicate content penalty.

Fix this by adding a `X-Robots-Tag: noindex` header on Vercel for the preview domain, OR add a redirect rule in your `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [{ "type": "host", "value": "chatevo-app.vercel.app" }],
      "destination": "https://chatsevo.com/$1",
      "permanent": true
    }
  ]
}
```

This tells Google that `chatsevo.com` is the canonical source.

### Step 6.6 — SEO Timeline Expectations

| Milestone | Expected Time |
|-----------|--------------|
| Google crawls your sitemap | 1–3 days |
| Homepage appears in Google | 3–7 days |
| Full site indexed | 1–3 weeks |
| Ranking for branded keywords (e.g., "Chatevo") | 1–2 weeks after indexing |
| Ranking for competitive keywords (e.g., "WhatsApp commerce") | 3–12 months (requires backlinks + content) |

> **Pro tip:** The fastest way to rank is to get other websites to link to `chatsevo.com`. Share your launch on Product Hunt, Twitter/X, LinkedIn, and relevant communities.

# Subdomain, WhatsApp API & Admin Panel Setup Guide
> chatsevo.com — Complete Step-by-Step

---

## Part 1 — Resend Email Subdomain (Avoid MX Conflict)

### Why You Need a Subdomain

Your domain `chatsevo.com` already has **MX records** pointing to Namecheap's email forwarding:
```
chatsevo.com  MX 10  eforward1.registrar-servers.com
chatsevo.com  MX 10  eforward2.registrar-servers.com
chatsevo.com  MX 15  eforward4.registrar-servers.com
chatsevo.com  MX 20  eforward5.registrar-servers.com
```

If you add Resend's MX record directly on `chatsevo.com`, it will **conflict** with these existing records, breaking email forwarding or sending delivery unpredictably.

**The fix (per Resend docs):** Register a **subdomain** in Resend instead of the root domain. Use `mail.chatsevo.com` as your Resend sending domain.

---

### Step 1.1 — Add the Resend Domain as a Subdomain

1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter **`mail.chatsevo.com`** (NOT `chatsevo.com`)
4. Click **"Add"**

Resend will show you **3–4 DNS records** to add. They will look like this (your values will differ slightly):

| Type | Host / Name | Value |
|------|-------------|-------|
| `MX` | `mail` | `feedback-smtp.us-east-1.amazonses.com` |
| `TXT` | `mail` | `v=spf1 include:amazonses.com ~all` |
| `TXT` | `resend._domainkey.mail` | `p=MIGf...` (long DKIM key) |
| `TXT` | `_dmarc.mail` | `v=DMARC1; p=none;` |

> **Important:** The `MX` record goes on `mail.chatsevo.com` — NOT on `chatsevo.com` — so it will NOT conflict with your existing email forwarding.

---

### Step 1.2 — Add These Records in Namecheap

1. Log in to [https://www.namecheap.com](https://www.namecheap.com)
2. Go to **Domain List** → click **"Manage"** next to `chatsevo.com`
3. Click the **"Advanced DNS"** tab
4. For each record Resend gives you, click **"Add New Record"**:

**For the MX record (Important Namecheap specific step):**
In Namecheap, you will NOT find "MX Record" in the regular "Add New Record" dropdown at the top.
Instead, scroll down the "Advanced DNS" page to the **Mail Settings** section.
1. Change the dropdown to **Custom MX**.
2. Click **Add New Record** in this Mail Settings section.
3. Host: `mail` (Namecheap adds `.chatsevo.com` automatically)
4. Value: the value Resend gives (e.g. `feedback-smtp.us-east-1.amazonses.com`)
5. Priority: `10`
6. Click the green checkmark to save.

**For each TXT record:**
Go back up to the **Host Records** section at the top of the page.
- Type: `TXT Record`
- Host: exactly what Resend shows (e.g. `resend._domainkey.mail` → enter `resend._domainkey.mail`)
- Value: paste the full value from Resend
- TTL: `Automatic`

5. Click **"Save All Changes"**
6. Return to Resend → click **"Verify DNS Records"**
   - DNS can take 5–30 minutes to propagate
   - Resend will show ✅ green checkmarks when verified

---

### Step 1.3 — Update Your App Environment Variables

Once Resend verifies `mail.chatsevo.com`, update these values everywhere:

**In `.env` and `.env.local`** (already partially done):
```env
RESEND_FROM_EMAIL=noreply@mail.chatsevo.com
EMAIL_FROM_DOMAIN=mail.chatsevo.com
```

**In Vercel Dashboard** → Settings → Environment Variables:
- `RESEND_FROM_EMAIL` = `noreply@mail.chatsevo.com`
- `EMAIL_FROM_DOMAIN` = `mail.chatsevo.com`

You can also use friendly names like:
- `Chatevo <noreply@mail.chatsevo.com>`
- `Chatevo Support <support@mail.chatsevo.com>`

---

## Part 2 — Admin Panel Subdomain (admin.chatsevo.com)

### Step 2.1 — Deploy Admin App to Vercel

The admin panel is at `apps/admin/`. It's a separate Next.js app and should be deployed as a **separate Vercel project**.

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your repository
3. **IMPORTANT:** Set the **Root Directory** to `apps/admin`
4. Framework: Next.js (auto-detected)
5. Click **"Deploy"**
6. Note the Vercel URL it gives you (e.g. `chatevo-admin.vercel.app`)

**Environment Variables for Admin (set in Vercel dashboard for this project):**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (same as merchant) |
| `CLERK_SECRET_KEY` | `sk_live_...` (same as merchant) |
| `TURSO_DATABASE_URL` | `libsql://sella-db-criminal-dev.aws-ap-northeast-1.turso.io` |
| `TURSO_AUTH_TOKEN` | Your Turso token |
| `ADMIN_USER_ID` | `user_3BcByb7YZoEbh10ELKCCZT0PGiy` |
| `SUPER_ADMIN_EMAIL` | Your personal email |
| `SUPER_ADMIN_JWT_SECRET` | A random 32+ character string |
| `ENCRYPTION_KEY` | `8e3fc9959778e8ccfc296960cd9cd67e` |

---

### Step 2.2 — Add admin.chatsevo.com to Vercel

1. In Vercel, open your **admin project** → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter `admin.chatsevo.com`
4. Vercel will show you a DNS record. It will be one of these:
   - **CNAME:** `admin` → `cname.vercel-dns.com`
   - **A record:** `admin` → `76.76.21.21` (use this if CNAME doesn't work for root)

---

### Step 2.3 — Add admin.chatsevo.com DNS in Namecheap

1. Log in to Namecheap → Domain List → **Manage** `chatsevo.com`
2. Click **"Advanced DNS"** tab
3. Click **"Add New Record"**:
   - Type: `CNAME Record`
   - Host: `admin`
   - Value: `cname.vercel-dns.com`
   - TTL: `Automatic`
4. Click **"Save All Changes"**
5. Go back to Vercel → wait 1–5 minutes → the domain shows ✅

**Result:** Your admin panel is now live at `https://admin.chatsevo.com`

---

### Step 2.4 — Lock Down the Admin Panel

The admin panel uses two authentication layers:
1. **Clerk Auth** — for team members (requires manual approval by SuperAdmin)
2. **Backdoor JWT** — for your personal super-admin access via `/auth/super-login`

To access your admin panel:
1. Go to `https://admin.chatsevo.com/auth/super-login`
2. Enter your `SUPER_ADMIN_EMAIL` and the password you set
3. You'll receive a JWT cookie and have full super-admin access

> **Never share the `/auth/super-login` URL publicly.**

---

## Part 3 — WhatsApp API Full Setup

### Overview of What You Need

Your app uses the **WhatsApp Cloud API (Meta/Facebook)** — not Twilio, not a third-party. Here's what's required:

| Credential | Where It Goes |
|-----------|---------------|
| `WHATSAPP_VERIFY_TOKEN` | Already set — used for webhook verification |
| `WHATSAPP_APP_SECRET` / `META_APP_SECRET` | Webhook signature verification |
| Per-merchant: `wa_phone_number_id` | Stored encrypted in DB per organization |
| Per-merchant: `wa_access_token` | Stored encrypted in DB per organization |

---

### Step 3.1 — Create a Meta Developer App

1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in:
   - App name: `Chatevo`
   - Contact email: your email
5. Click **"Create App"**

---

### Step 3.2 — Add WhatsApp Product

1. In your new Meta app dashboard, scroll down to **"Add Products"**
2. Find **"WhatsApp"** → click **"Set Up"**
3. You're now in the WhatsApp setup section

---

### Step 3.3 — Get a Phone Number and Test Token

Meta gives you a **free test phone number** to start:

1. Go to **WhatsApp** → **API Setup** in the left sidebar
2. You'll see:
   - **Phone number ID** — copy this (looks like `123456789012345`)
   - **WhatsApp Business Account ID** — copy this too
3. Click **"Generate Token"** under "Temporary access token"
   - This is a 24-hour token for testing
   - For production, you need a **System User Token** (see Step 3.7)

---

### Step 3.4 — Register Your Webhook in Meta

Your webhook URL is: `https://chatsevo.com/api/webhook`

1. In Meta App Dashboard → **WhatsApp** → **Configuration** (left sidebar)
2. Under **"Webhook"**, click **"Edit"**
3. Fill in:
   - **Callback URL:** `https://chatsevo.com/api/webhook`
   - **Verify Token:** `sella-webhook-verification-2024`  
     *(This must match `WHATSAPP_VERIFY_TOKEN` in your `.env`)*
4. Click **"Verify and Save"**
   - Meta calls your URL with a GET request
   - Your code at `apps/merchant/app/api/webhook/route.ts` handles this automatically
5. After verification, click **"Manage"** and enable these webhook fields:
   - ✅ `messages`
   - ✅ `message_deliveries`
   - ✅ `message_reads`

---

### Step 3.5 — Set App Secret in Your Env

1. In Meta App Dashboard → **Settings** → **Basic**
2. Copy the **"App Secret"** value
3. Add to your Vercel environment variables:

| Variable | Value |
|----------|-------|
| `META_APP_SECRET` | Your app secret from Meta |
| `WHATSAPP_APP_SECRET` | Same value (your app uses both names) |
| `WA_WEBHOOK_VERIFY_TOKEN` | `sella-webhook-verification-2024` |

> **Your webhook code checks `WA_WEBHOOK_VERIFY_TOKEN` for GET verification and `META_APP_SECRET` for POST signature validation.**

---

### Step 3.6 — Connect WhatsApp Per Merchant (In-App Flow)

Each merchant connects their own WhatsApp number through the dashboard:

1. Merchant logs in to `https://chatsevo.com/dashboard`
2. Goes to **Settings** → **WhatsApp**
3. Enters their:
   - **Phone Number ID** (from Meta Business Manager)
   - **Access Token** (from Meta, encrypted and stored in DB)
4. The app calls `PUT /api/settings/whatsapp` which stores credentials encrypted

The webhook at `/api/webhook` automatically routes incoming messages to the correct merchant by matching `phone_number_id`.

---

### Step 3.7 — Get a Permanent System User Token (Production)

The temporary token from Step 3.3 expires in 24 hours. For production:

1. Go to [https://business.facebook.com](https://business.facebook.com)
2. Click **Settings** (gear icon) → **Users** → **System Users**
3. Click **"Add"** → name it `Chatevo Bot`
4. Role: **Admin**
5. Click **"Generate New Token"**
   - Select your Meta app
   - Enable permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
6. Copy the token — this is what merchants use as their **Access Token** in the app settings

---

### Step 3.8 — Send a Test Message

Before going live:

1. In Meta App Dashboard → **WhatsApp** → **API Setup**
2. In the "Send and receive messages" section
3. Enter a real phone number in "To" field
4. Click **"Send Message"**
5. You should receive a "Hello World" WhatsApp message

If you receive it — WhatsApp is working.

---

### Step 3.9 — Go Live / Request Permanent Access

By default, the Meta app is in **Development mode** and can only message test numbers.

To message ANY number:
1. Meta App Dashboard → **App Review** → **Requests**
2. Request the permission: `whatsapp_business_messaging`
3. Provide your use case description (e.g. "WhatsApp commerce platform for merchants to receive orders")
4. Meta reviews within 1–5 business days

Alternatively:
1. Go to **Settings** → **Basic**
2. Switch the toggle from **"In Development"** to **"Live"**
3. You can send to any number once verified

---

## Part 4 — Admin Panel Setup Checklist

After deploying to `admin.chatsevo.com`:

### Step 4.1 — Set Your Super Admin ID

Your Clerk User ID is already set: `ADMIN_USER_ID=user_3BcByb7YZoEbh10ELKCCZT0PGiy`

This ID gets full super-admin access automatically without needing approval.

### Step 4.2 — First Login

1. Go to `https://admin.chatsevo.com`
2. Click **"Platform Login"**
3. Sign in with your Clerk account
4. Since your Clerk ID matches `ADMIN_USER_ID`, you get instant super-admin access

### Step 4.3 — Approve Team Members

When another person signs up on the admin panel:
1. They see a "Waiting for approval" screen
2. You (super admin) go to **Team** section in admin panel
3. Find the pending user
4. Click **"Approve"** and assign a role

### Step 4.4 — Admin Panel Features

| Section | What It Does |
|---------|-------------|
| **Overview** | Platform stats, MRR, active users |
| **User Management** | View/ban/activate all merchants |
| **Revenue** | Subscription payments, MRR tracking |
| **Waitlist** | Manage early access signups |
| **Support Tickets** | Respond to merchant support requests |
| **Notifications** | Send platform-wide announcements |
| **Affiliates** | Approve affiliates, manage payouts |
| **Team** | Manage admin team member access |
| **Audit Logs** | Full trail of all admin actions (super-admin only) |

---

## Part 5 — Clerk Webhook Setup

Clerk needs to notify your database whenever a user signs up, updates their profile, or is deleted. You do this by setting up a webhook endpoint.

### Step 5.1 — Add the Webhook Endpoint in Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com) and ensure you are in the **Production** environment.
2. In the left sidebar, click **Configure** → **Webhooks**.
3. Click the **Add Endpoint** button.
4. For the **Endpoint URL**, enter: `https://chatsevo.com/api/webhooks/clerk`
5. In the **Message Filtering** (events) section, check the box to select all **User** events, or specifically select:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Click **Create** to save the endpoint.

### Step 5.2 — Get the Webhook Secret

1. After creating the endpoint, you will be taken to its details page.
2. Look for the **Signing Secret** section on the right side of the page.
3. Click the eye icon to reveal it, and copy the secret (it starts with `whsec_...`).

### Step 5.3 — Update Your Environment Variables

1. Go to your Vercel Dashboard for the **Merchant app** (`chatsevo.com`).
2. Navigate to **Settings** → **Environment Variables**.
3. Add a new variable or update the existing one:
   - Key: `CLERK_WEBHOOK_SECRET`
   - Value: paste the `whsec_...` secret you just copied.
4. Save it and trigger a **Redeploy** on Vercel so the new environment variable takes effect.
5. *(Optional)* Update your local `.env` and `.env.local` with this value as well for local testing.

---

## Summary — All Subdomains

| Subdomain | Purpose | Points To |
|-----------|---------|-----------|
| `chatsevo.com` | Main merchant app | Vercel project (merchant) |
| `admin.chatsevo.com` | Admin panel | Vercel project (admin) |
| `mail.chatsevo.com` | Resend email sending | Resend DNS records (MX, SPF, DKIM) |
| `accounts.chatsevo.com` | Clerk auth | Already set ✅ |
| `clerk.chatsevo.com` | Clerk frontend API | Already set ✅ |

## Summary — All Webhook URLs to Register

| Service | Webhook URL |
|---------|------------|
| WhatsApp / Meta | `https://chatsevo.com/api/webhook` |
| Clerk | `https://chatsevo.com/api/webhooks/clerk` |
| Paystack | `https://chatsevo.com/api/payments/webhook/paystack` |
| Stripe | `https://chatsevo.com/api/payments/webhook/stripe` |

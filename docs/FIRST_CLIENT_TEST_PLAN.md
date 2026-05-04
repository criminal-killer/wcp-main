# First Paying Client Readiness: Manual QA Test Plan

This document provides a step-by-step manual QA testing checklist to verify the platform is fully ready to onboard its first paying clients.

## A) Merchant Onboarding

- [ ] **Sign Up:** Navigate to the public site and complete the Clerk sign-up flow.
  - *Expected Result:* User account is successfully created and user is redirected to `/onboarding`.
- [ ] **Create Organization:** Complete the onboarding form (store name, currency, timezone).
  - *Expected Result:* An organization record is created in the database, and the user is redirected to the `/dashboard`.
- [ ] **Trial Banner:** Check the dashboard banner.
  - *Expected Result:* The banner correctly displays the days left in trial (e.g., "14 days left") and prompts the user to subscribe.

## B) WhatsApp Setup

- [ ] **Save Credentials:** In the dashboard Settings > WhatsApp page, input a valid Meta `phone_number_id` and `token` and save.
  - *Expected Result:* Credentials are saved securely to the database.
- [ ] **Test Connection:** Click the "Test Connection" button.
  - *Expected Result:* The system sends a ping to the Meta API and reports a successful connection.
- [ ] **Webhook Verification:** Trigger a webhook verification from the Meta developer portal.
  - *Expected Result:* The `whatsapp_verified` flag on the organization is set to `true` (1), and the settings page reflects the active verified status.

## C) Core Commerce Flow

- [ ] **Create Product:** In the dashboard Products page, create a new product with an image, title, description, and price.
  - *Expected Result:* The product is saved and appears in the product list.
- [ ] **Public Storefront:** Visit the merchant's public store link.
  - *Expected Result:* The store page loads and correctly displays the newly created product.
- [ ] **WhatsApp Shopping Flow:** Simulate a buyer sending a message to the connected WhatsApp number to initiate a purchase, or add the product to the cart on the storefront and checkout.
  - *Expected Result:* An order is successfully created in the system.
- [ ] **Order Management:** View the Orders page in the merchant dashboard.
  - *Expected Result:* The new order appears with the correct status, customer details, and total amount.

## D) Billing (Stripe)

- [ ] **Subscribe to Starter:** Navigate to the billing page and subscribe to the Starter plan using a test credit card.
  - *Expected Result:* The Stripe checkout session completes successfully.
- [ ] **Webhook Verification:** Check the database `organizations` and `subscriptions` tables.
  - *Expected Result:* The webhook successfully updates `organizations.plan` to 'starter' and creates/updates an active record in `subscriptions`.
- [ ] **Idempotency Check:** Replay the exact same `checkout.session.completed` webhook event using the Stripe CLI.
  - *Expected Result:* The system ignores the duplicate event. No double-credits or duplicate entries are created in the `payments_log` table.

## E) Affiliate Program (Cash Commission)

- [ ] **Affiliate Apply:** Visit `/affiliates/apply` and submit a new affiliate application.
  - *Expected Result:* The application is recorded in the `affiliates` table with a 'pending' status.
- [ ] **Admin Approval:** Log into the Admin dashboard (`/admin`), navigate to Affiliates, and approve the application.
  - *Expected Result:* The affiliate's status changes to 'approved'.
- [ ] **Referred Sign Up:** As a new test merchant, sign up using the affiliate's referral link (`?ref=<code>`).
  - *Expected Result:* The new organization is created with the `referred_by` field set to the affiliate's code.
- [ ] **First Payment Commission:** Have the referred merchant subscribe to a paid plan.
  - *Expected Result:* The `referrals` table records a 'paid' event with `is_first_payment=1`. The affiliate's balance increases by 40% of the payment amount.
- [ ] **Renewal Commission:** Trigger a recurring invoice payment (`invoice.payment_succeeded`) for the referred merchant.
  - *Expected Result:* A new `referrals` row is added with `is_first_payment=0`. The affiliate's balance increases by 10% of the renewal amount.
- [ ] **Payout Request & Processing:**
  1. The affiliate requests a payout from their dashboard (balance > $100).
  2. Admin navigates to `/affiliates/payouts` and clicks "Mark Paid".
  - *Expected Result:* The affiliate's balance is decremented by the requested amount, and the payout status is updated to 'paid'.

## F) Merchant Referral Discount Program

- [ ] **Count Paying Referrals:** Have an existing merchant refer several new merchants who then subscribe to paid plans.
  - *Expected Result:* The referring merchant's `paying_referrals_count` correctly increments for each unique paying organization.
- [ ] **Unlock Discount (10 Referrals):** Simulate reaching 10 paying referrals.
  - *Expected Result:* The `referral_discount_active` flag is set to `1`, and `referral_discount_expires_at` is set to exactly 6 months in the future.
- [ ] **Settings UI:** View the merchant's referral settings page.
  - *Expected Result:* The UI displays the "50% Off Activated!" state and shows the correct expiration date.

## G) Observability

- **Where to check logs:**
  - Open your Vercel Dashboard, select the project (Merchant or Admin), and navigate to the **Logs** tab. Filter by `Error` or `Warning` to quickly spot issues.
- **What to look for in webhook failures:**
  - *Missing Secrets:* "Invalid signature" errors usually mean the `STRIPE_WEBHOOK_SECRET` or `PAYSTACK_WEBHOOK_SECRET` is missing or mismatched in the Vercel environment variables.
  - *Idempotency Skips:* Look for `[webhook/*] Duplicate event ... — skipping` to confirm that idempotency keys are working and preventing double-processing on retries.
  - *Database Errors:* Look for `SQLITE_CONSTRAINT` errors to identify missing records or schema mismatches.

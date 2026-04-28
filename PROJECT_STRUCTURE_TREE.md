# Full Project Structure

```text
.
├── .github/
│   └── workflows/
│       ├── cold-email-weekday.yml
│       ├── comment-bot.yml
│       ├── marketing-janitor.yml
│       ├── social-media-daily.yml
│       └── sync-subrepos.yml
├── app/
│   ├── admin/
│   │   └── page.tsx
│   ├── affiliates/
│   │   ├── apply/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   ├── auto-replies/
│   │   │   └── route.ts
│   │   ├── contacts/
│   │   │   ├── export/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── conversations/
│   │   │   └── route.ts
│   │   ├── cron/
│   │   │   ├── expire-trials/
│   │   │   │   └── route.ts
│   │   │   └── payouts/
│   │   │       └── route.ts
│   │   ├── messages/
│   │   │   ├── send/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── onboarding/
│   │   │   └── route.ts
│   │   ├── orders/
│   │   │   ├── [id]/
│   │   │   │   └── status/
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   ├── payments/
│   │   │   ├── store-webhook/
│   │   │   │   └── route.ts
│   │   │   ├── subscribe/
│   │   │   │   └── route.ts
│   │   │   └── webhook/
│   │   │       ├── paystack/
│   │   │       │   └── route.ts
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── products/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── settings/
│   │   │   ├── ai/
│   │   │   │   └── route.ts
│   │   │   ├── payments/
│   │   │   │   └── route.ts
│   │   │   ├── store/
│   │   │   │   └── route.ts
│   │   │   └── whatsapp/
│   │   │       ├── test-connection/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── tickets/
│   │   │   └── route.ts
│   │   ├── webhook/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts
│   ├── dashboard/
│   │   ├── contacts/
│   │   │   └── page.tsx
│   │   ├── docs/
│   │   │   └── page.tsx
│   │   ├── inbox/
│   │   │   ├── inbox-client.tsx
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── referrals/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── settings-client.tsx
│   │   ├── setup-booking/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── sidebar.tsx
│   ├── docs/
│   │   └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── sign-up/
│   │   ├── [[...sign-up]]/
│   │   │   └── page.tsx
│   │   └── choose-plan/
│   │       └── page.tsx
│   ├── store/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── globals.css
│   ├── icon.png
│   ├── layout.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── dashboard/
│   │   ├── AiAssist.tsx
│   │   └── ThemePicker.tsx
│   ├── LoadingStore.tsx
│   └── ThemeProvider.tsx
├── docs/
│   ├── FUTURE-SETUP.md
│   └── PRODUCTION_PLAYBOOK.md
├── lib/
│   ├── db.ts
│   ├── email.ts
│   ├── encryption.ts
│   ├── payments.ts
│   ├── redis.ts
│   ├── schema.ts
│   ├── store-engine.ts
│   └── whatsapp.ts
├── sella-marketing-hub/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── leads/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── posts/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── lib/
│   │   │   └── auth.ts
│   │   ├── scripts/
│   │   │   └── janitor.ts
│   │   └── middleware.ts
│   ├── drizzle.config.ts
│   └── package.json
├── src/
│   ├── app/
│   │   ├── affiliates/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── super-login/
│   │   │           └── route.ts
│   │   ├── auth/
│   │   │   └── super-login/
│   │   │       └── page.tsx
│   │   ├── not-authorized/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── revenue/
│   │   │   └── page.tsx
│   │   ├── system/
│   │   │   ├── logs/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── team/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── waiting-approval/
│   │   │   └── page.tsx
│   │   ├── waitlist/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── actions/
│   │   │   └── admin.ts
│   │   ├── audit.ts
│   │   ├── db.ts
│   │   └── schema.ts
│   └── middleware.ts
├── theme-factory/
│   ├── themes/
│   │   ├── arctic-frost.md
│   │   ├── botanical-garden.md
│   │   ├── desert-rose.md
│   │   ├── forest-canopy.md
│   │   ├── golden-hour.md
│   │   ├── midnight-galaxy.md
│   │   ├── modern-minimalist.md
│   │   ├── ocean-depths.md
│   │   ├── sunset-boulevard.md
│   │   ├── tech-innovation.md
│   │   └── whatsapp-classic.md
│   ├── LICENSE.txt
│   └── theme-showcase.pdf
├── wacommerce/
│   ├── .github/
│   │   └── workflows/
│   │       ├── cold-email-weekday.yml
│   │       ├── comment-bot.yml
│   │       └── social-media-daily.yml
│   ├── admin-panel/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── actions/
│   │   │   │   │   └── notifications.ts
│   │   │   │   ├── affiliates/
│   │   │   │   │   ├── actions.ts
│   │   │   │   │   ├── affiliates-client.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── api/
│   │   │   │   │   └── auth/
│   │   │   │   │       └── super-login/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── auth/
│   │   │   │   │   └── super-login/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── not-authorized/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── revenue/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── system/
│   │   │   │   │   ├── logs/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── team/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── tickets/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── waiting-approval/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── waitlist/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── lib/
│   │   │   │   ├── actions/
│   │   │   │   │   └── admin.ts
│   │   │   │   ├── audit.ts
│   │   │   │   ├── db.ts
│   │   │   │   └── schema.ts
│   │   │   └── middleware.ts
│   │   ├── .gitignore
│   │   ├── find-user.js
│   │   ├── fix-encoding.js
│   │   ├── next-env.d.ts
│   │   ├── next.config.mjs
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── SYNC_TEST.md
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   ├── docs/
│   │   ├── ADMIN_DASHBOARD_SPEC.md
│   │   ├── API_DESIGN.md
│   │   ├── API_SETUP_GUIDE.md
│   │   ├── CLAUDE_MASTER_PROMPT.md
│   │   ├── COLD_EMAIL_AUTOMATION.md
│   │   ├── COMPETITOR_ANALYSIS.md
│   │   ├── COST_PROJECTIONS.md
│   │   ├── DATABASE_SCHEMA.md
│   │   ├── GROWTH_STRATEGY.md
│   │   ├── LANDING_PAGE_SPEC.md
│   │   ├── LOCALIZATION.md
│   │   ├── MIGRATION_PLAN.md
│   │   ├── PAYMENTS_INTEGRATION.md
│   │   ├── PRD.md
│   │   ├── PRICING_STRATEGY.md
│   │   ├── REFERRAL_SYSTEM.md
│   │   ├── ROADMAP.md
│   │   ├── SECURITY_AND_COMPLIANCE.md
│   │   ├── SOCIAL_MEDIA_AUTOMATION.md
│   │   ├── TECHNICAL_ARCHITECTURE.md
│   │   ├── WHATSAPP_AI_COMMERCE.md
│   │   └── WHATSAPP_INTEGRATION.md
│   ├── phase-1-waitlist/
│   │   ├── automation/
│   │   │   ├── dm-templates/
│   │   │   │   ├── instagram-dm.md
│   │   │   │   └── whatsapp-dm.md
│   │   │   ├── email_templates/
│   │   │   │   └── follow-up.html
│   │   │   ├── email-templates/
│   │   │   │   └── cold-email-v1.html
│   │   │   ├── scripts/
│   │   │   │   ├── comment-bot.js
│   │   │   │   ├── dont-repeat.json
│   │   │   │   ├── post-to-social.js
│   │   │   │   ├── scrape-businesses.js
│   │   │   │   ├── scraped-businesses.json
│   │   │   │   ├── send-cold-emails.js
│   │   │   │   └── utils.js
│   │   │   ├── content-bank.json
│   │   │   └── GITHUB_ACTIONS_SETUP.md
│   │   ├── landing-page/
│   │   │   ├── assets/
│   │   │   │   └── og-image.html
│   │   │   ├── admin-login.php
│   │   │   ├── admin.php
│   │   │   ├── config.example.php
│   │   │   ├── count.php
│   │   │   ├── database.sql
│   │   │   ├── en.php
│   │   │   ├── export.php
│   │   │   ├── fr.php
│   │   │   ├── index.html
│   │   │   ├── index.php
│   │   │   ├── main.js
│   │   │   ├── robots.txt
│   │   │   ├── sitemap.xml
│   │   │   ├── style.css
│   │   │   ├── submit.php
│   │   │   ├── sw.php
│   │   │   ├── thank-you.php
│   │   │   └── track.php
│   │   ├── README.md
│   │   └── sella-landing-page.zip
│   ├── phase-2-app/
│   │   ├── app/
│   │   │   ├── actions/
│   │   │   │   └── affiliates.ts
│   │   │   ├── admin/
│   │   │   │   ├── waitlist/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── waitlist-client.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── affiliate-dashboard/
│   │   │   │   ├── dashboard-client.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── affiliates/
│   │   │   │   ├── apply/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── api/
│   │   │   │   ├── admin/
│   │   │   │   │   └── bulk-onboard/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── ai/
│   │   │   │   │   └── chat/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── auto-replies/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── carts/
│   │   │   │   │   └── abandoned/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── contacts/
│   │   │   │   │   ├── export/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── conversations/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── cron/
│   │   │   │   │   ├── expire-trials/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── payouts/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── messages/
│   │   │   │   │   ├── send/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── onboarding/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── orders/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── status/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   ├── store-webhook/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── subscribe/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── webhook/
│   │   │   │   │       ├── paystack/
│   │   │   │   │       │   └── route.ts
│   │   │   │   │       └── stripe/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── products/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── referrals/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── settings/
│   │   │   │   │   ├── ai/
│   │   │   │   │   │   ├── revoke/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── chatbot/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── fulfillment/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   ├── revoke-paystack/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── team/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── whatsapp/
│   │   │   │   │       ├── revoke/
│   │   │   │   │       │   └── route.ts
│   │   │   │   │       ├── test-connection/
│   │   │   │   │       │   └── route.ts
│   │   │   │   │       └── route.ts
│   │   │   │   ├── test/
│   │   │   │   │   └── seed/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── tickets/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── webhook/
│   │   │   │   │   └── route.ts
│   │   │   │   └── webhooks/
│   │   │   │       ├── clerk/
│   │   │   │       │   └── route.ts
│   │   │   │       └── stripe/
│   │   │   │           └── route.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── contacts/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── docs/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── inbox/
│   │   │   │   │   ├── inbox-client.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── orders/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── order-actions.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── abandoned/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── products/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   ├── referrals/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── referrals-client.tsx
│   │   │   │   │   ├── team/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── settings-client.tsx
│   │   │   │   ├── setup-booking/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── sidebar.tsx
│   │   │   ├── docs/
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   ├── [[...sign-up]]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── choose-plan/
│   │   │   │       └── page.tsx
│   │   │   ├── store/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── icon.png
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── robots.ts
│   │   │   └── sitemap.ts
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── AiAssist.tsx
│   │   │   │   ├── ThemePicker.tsx
│   │   │   │   └── WaitlistOverlay.tsx
│   │   │   ├── landing/
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Pricing.tsx
│   │   │   │   └── Typewriter.tsx
│   │   │   ├── ui/
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── skeleton.tsx
│   │   │   ├── LoadingStore.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── docs/
│   │   │   └── FUTURE-SETUP.md
│   │   ├── lib/
│   │   │   ├── ai-service.ts
│   │   │   ├── db.ts
│   │   │   ├── email.ts
│   │   │   ├── encryption.ts
│   │   │   ├── payments.ts
│   │   │   ├── redis.ts
│   │   │   ├── schema.ts
│   │   │   ├── store-engine.ts
│   │   │   ├── utils.ts
│   │   │   └── whatsapp.ts
│   │   ├── theme-factory/
│   │   │   ├── themes/
│   │   │   │   ├── arctic-frost.md
│   │   │   │   ├── botanical-garden.md
│   │   │   │   ├── desert-rose.md
│   │   │   │   ├── forest-canopy.md
│   │   │   │   ├── golden-hour.md
│   │   │   │   ├── midnight-galaxy.md
│   │   │   │   ├── modern-minimalist.md
│   │   │   │   ├── ocean-depths.md
│   │   │   │   ├── sunset-boulevard.md
│   │   │   │   ├── tech-innovation.md
│   │   │   │   └── whatsapp-classic.md
│   │   │   ├── LICENSE.txt
│   │   │   └── theme-showcase.pdf
│   │   ├── webapp-testing/
│   │   │   ├── examples/
│   │   │   │   ├── console_logging.py
│   │   │   │   ├── element_discovery.py
│   │   │   │   └── static_html_automation.py
│   │   │   ├── scripts/
│   │   │   │   └── with_server.py
│   │   │   ├── chatevo_admin_live.png
│   │   │   ├── LICENSE.txt
│   │   │   ├── test_live_urls.py
│   │   │   └── Webapp_testing_SKILL.md
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   ├── drizzle.config.js
│   │   ├── drizzle.config.ts.bak
│   │   ├── fix_db_final.mjs
│   │   ├── fix_db.mjs
│   │   ├── middleware.ts
│   │   ├── next-env.d.ts
│   │   ├── next.config.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── README.md
│   │   ├── roadmap.md
│   │   ├── SYNC_TEST.md
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.tsbuildinfo
│   │   ├── vercel.json
│   │   └── walkthrough_phase2_final.md
│   ├── phase-3-launch/
│   │   ├── product-hunt/
│   │   │   └── tagline.md
│   │   ├── social-posts/
│   │   │   └── launch-day-posts.md
│   │   └── launch-checklist.md
│   ├── .gitignore
│   ├── AGENTS.md
│   └── README.md
├── webapp-testing/
│   ├── examples/
│   │   ├── console_logging.py
│   │   ├── element_discovery.py
│   │   └── static_html_automation.py
│   ├── scripts/
│   │   └── with_server.py
│   ├── LICENSE.txt
│   └── Webapp_testing_SKILL.md
├── .env.example
├── .gitignore
├── deploy_phase2.ps1
├── deployment_report.md
├── drizzle.config.js
├── drizzle.config.ts.bak
├── find-user.js
├── fix-encoding.js
├── generate-tree.js
├── middleware.ts
├── next-env.d.ts
├── next.config.js
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── PROJECT_CONTEXT.md
├── README.md
├── REPO_GUIDE.md
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── walkthrough_phase2_final.md
```

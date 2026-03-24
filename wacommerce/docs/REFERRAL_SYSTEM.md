# Referral System
# SELLA

---

## How It Works

Every Sella user gets a unique referral link:
`https://sella.io/ref/{referral_code}`

When someone signs up using that link:
- **Referrer** gets 1 month free (credited to their subscription)
- **New user** gets 20% off first 2 months

---

## Referral Tiers

| Tier | Referrals | Reward |
|------|-----------|--------|
| 🥉 Bronze | 3 | 1 month free |
| 🥈 Silver | 10 | 3 months free + Growth features |
| 🥇 Gold | 25 | 6 months free + Premium features |
| 💎 Ambassador | 50+ | Free forever + 10% revenue share |

---

## Implementation

### Database
```sql
-- referral_code is generated on org creation
-- stored in organizations.referral_code

-- referrals table tracks each referral
INSERT INTO referrals (referrer_org_id, referral_code, status)
VALUES ('org_123', 'amani-x7k2', 'clicked')

-- When referred user signs up:
UPDATE referrals SET referred_org_id = 'org_456', status = 'signed_up'

-- When referred user subscribes:
UPDATE referrals SET status = 'subscribed'
-- Apply reward to referrer
```

### Tracking Flow
1. Visitor clicks `sella.io/ref/amani-x7k2`
2. Referral code stored in cookie (30-day expiry)
3. Visitor signs up → referral recorded as "signed_up"
4. Visitor subscribes → referral recorded as "subscribed"
5. Reward applied to referrer's account
6. Both notified via email

### Dashboard Widget
Each user sees in their dashboard:
- "Your referral link: [copy button]"
- "Share on WhatsApp" button
- Referral stats: clicks, signups, paid conversions
- Current tier and progress to next tier
- Rewards earned

### Growth Loops
1. **Powered by Sella:** Footer on every mini-website → clicks → signups
2. **Order confirmations:** "Powered by Sella" in WhatsApp messages
3. **Referral sharing:** Users share link with other business owners
4. **WhatsApp Status:** Feature to share products on WA Status (with Sella branding)

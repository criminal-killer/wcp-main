# Cold Email Automation
# SELLA — Business Scraper + Email Outreach

---

## 1. Overview

Automatically find local businesses using OpenStreetMap,
enrich with contact info, and send personalized cold emails.
All automated via GitHub Actions.

---

## 2. Pipeline
1. **OpenStreetMap (free):** Query businesses by city
2. **Enrichment (Google/Facebook):** Find email/phone/website
3. **Filter:** Remove already-contacted
4. **Personalize Email**
5. **Send via SMTP** (Gmail/Zoho free)
6. **Log Results**
7. **Follow-up** (Day 3)

---

## 3. OpenStreetMap Query

### Overpass API (free, no API key)
URL: `https://overpass-api.de/api/interpreter`

Query for shops in Nairobi:
```overpass
[out:json][timeout:60];
area["name"="Nairobi"]->.a;
(
  node["shop"](area.a);
  node["amenity"="restaurant"](area.a);
  node["craft"](area.a);
);
out body;
```

### Target Cities (Phase 1)
- Nairobi, Mombasa, Kisumu (Kenya)
- Lagos, Abuja (Nigeria)
- Accra (Ghana)

### Data Returned
- Shop name
- Shop type (clothing, restaurant, salon)
- Address/coordinates
- Phone (sometimes)
- Website (sometimes)

---

## 4. Email Templates

### Template A: Direct
**Subject:** Quick question about {shop_name}'s WhatsApp

Hi {shop_name} team,

I noticed your business on Google Maps and wanted to ask:
Do you get a lot of "how much?" messages on WhatsApp?

I'm building SELLA — a tool that turns WhatsApp into a full store.
Your customers can browse products, select sizes, and pay via
M-Pesa, all without leaving the chat.

We're launching soon. Want free early access?
→ {waitlist_link}

No pressure at all!
{your_name}, Founder @ SELLA

### Template B: Problem-focused
**Subject:** {shop_name} — your customers want to buy on WhatsApp

Hi there,

I bet you spend hours answering "how much?" messages on WhatsApp.

What if your customers could browse your products, pick what they
want, and pay via M-Pesa — all inside WhatsApp automatically?

That's what SELLA does. And we're launching soon.
→ {waitlist_link}

Join {count}+ businesses already on the waitlist.
{your_name}

### Follow-up (Day 3)
**Subject:** Re: Quick question about {shop_name}'s WhatsApp

Hi again,

Just bumping this in case you missed it.

We're helping businesses sell directly on WhatsApp
(no website needed). Would love your thoughts.

→ {waitlist_link}

{your_name}

---

## 5. GitHub Actions Workflow

### .github/workflows/cold-email-weekday.yml
```yaml
name: Cold Email Outreach
on:
  schedule:
    - cron: '0 14 * * 1-5'  # 9 AM EST, Mon-Fri

jobs:
  outreach:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install axios nodemailer
      - run: node phase-1-waitlist/automation/scripts/scrape-businesses.js
      - run: node phase-1-waitlist/automation/scripts/send-cold-emails.js
        env:
          SMTP_HOST: ${{ secrets.SMTP_HOST }}
          SMTP_USER: ${{ secrets.SMTP_USER }}
          SMTP_PASS: ${{ secrets.SMTP_PASS }}
```

## 6. Volume & Expectations
- **Send:** 20-50 emails/day (stay under spam thresholds)
- **Monthly:** 400-1,000 emails
- **Expected response rate:** 2-5%
- **Expected signup rate:** 1-3%
- **Monthly waitlist from cold email:** 8-30 entries

# Landing Page Specification
# SELLA — Pre-Launch Waitlist Page

---

## 1. Overview

**Platform:** InfinityFree (free PHP hosting)
**Tech:** PHP + HTML + CSS + JavaScript
**Purpose:** Collect waitlist signups before app launches
**Languages:** English (default), Swahili, French
**URL:** `sella.infinityfreeapp.com` (or `sella.io` when domain purchased)

---

## 2. Page Sections

### Section 1: Hero
[Sella Logo]

**Sell smarter. On WhatsApp.**

Your customers browse, buy, and pay —
all inside WhatsApp. No website needed.

[🚀 Join the Waitlist — It's Free]

🔥 {count} businesses already waiting

[Chat mockup animation/image showing shopping flow]

### Section 2: Problems
**Sound familiar?**

😫 "I reply to 200 'how much?' messages every day"
😤 "Customers leave when I send website links"
😰 "I manage orders in a notebook"
💸 "Other tools charge $99/month"
😩 "I can't accept M-Pesa payments easily"

### Section 3: Solution
**What if your WhatsApp could...**

🛍️ Show your entire product catalog
💳 Accept payments (M-Pesa, Cards, PayPal)
🤖 Answer customer questions automatically
📦 Track orders from purchase to delivery
📊 Show you exactly what's selling
🌐 Give you a free online store

### Section 4: How It Works
**3 Simple Steps:**

1️⃣ **Add Your Products**
Upload products with photos and prices.
Takes 5 minutes.

2️⃣ **Connect WhatsApp**
Link your WhatsApp Business number.
One-time setup.

3️⃣ **Start Selling**
Customers shop and pay in WhatsApp.
You manage orders from your dashboard.

### Section 5: Chat Demo
[Animated/static WhatsApp chat mockup]

- **Customer:** Hi!
- **Bot:** Welcome to Amani Fashion! 👋
[🛍️ Shop] [📦 Track Order]
- **Customer:** clicks Shop
- **Bot:** Choose a category:
[👕 Clothing] [👟 Shoes] [🎒 Accessories]
...
- **Bot:** ✅ Payment received! Order confirmed! 🎉

### Section 6: Pricing Preview
**Why pay more for less?**

| Feature | Others | Sella |
|---------|--------|-------|
| Price | $49-99/mo | $29/mo |
| Markup | 12-20% | 0% |
| Store | ❌ | ✅ |
| Payments| ❌ | ✅ M-Pesa + Cards |
| AI Bot | 💰 Extra | ✅ Included |
| Website | ❌ | ✅ Auto-built |

[Starter $29/mo] [Growth: Coming Soon] [Premium: Coming Soon]

### Section 7: Waitlist Form
(Full form as designed in brainstorm — see Section 3 below)

### Section 8: Footer
© 2025 Sella. Sell smarter. On WhatsApp.
[Twitter] [Facebook] [Instagram] [LinkedIn]

---

## 3. Waitlist Form Fields

### Required (4 fields)
- Full Name (text)
- Email (email)
- WhatsApp Number (tel with country code)
- Country (dropdown — auto-detect from IP)

### Optional — Business Info
- Business type (dropdown: Fashion, Food, Electronics, etc.)
- How do you currently sell? (checkboxes: WhatsApp only, Instagram+WA, etc.)
- Monthly orders (dropdown: None yet, 1-20, 20-50, 50-200, 200+)

### Optional — Problems (Checkboxes)
"What challenges do you face? (tick all that apply)"
- [ ] Too much time replying "how much?"
- [ ] Customers leave when I send website links
- [ ] Lose track of orders
- [ ] Can't accept payments easily
- [ ] Don't know which products sell best
- [ ] Team can't access same WhatsApp
- [ ] Miss sales at night
- [ ] Customers don't come back
- [ ] COD orders get returned
- [ ] Can't send promotions to all customers
- [ ] Don't have a website
- [ ] Current tools too expensive
- Custom text field: "Your biggest frustration?"

### Optional — Pricing
- "How much would you pay monthly?" (dropdown: $0, $10-15, $15-25, $25-35, $35-50, $50+, Need to see first)
- "Currently paying for any tool?" (dropdown: No, Under $20, $20-50, $50-100, Over $100)
- "Would you pay if we solve your problems?" (radio: Yes definitely, Probably, Need to see, Not sure)

### Optional — Beta
- [ ] I want to be a Beta Tester
- Device (Android/iPhone/Laptop)
- Product count (1-10, 10-50, 50-200, 200+)
- Can we WhatsApp you for feedback? (Yes/No)

### Optional — Attribution
- Referral code (text)
- How did you hear about us? (dropdown: Facebook, TikTok, YouTube, Twitter, Instagram, WhatsApp, Google, Friend, Other)

---

## 4. Database (MySQL on InfinityFree)

```sql
CREATE TABLE waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(20),
    country VARCHAR(100),
    business_type VARCHAR(100),
    current_selling TEXT,
    monthly_orders VARCHAR(50),
    problems TEXT,
    custom_problem TEXT,
    pricing_willingness VARCHAR(50),
    currently_paying VARCHAR(50),
    current_tool VARCHAR(100),
    would_pay VARCHAR(50),
    wants_beta TINYINT DEFAULT 0,
    device VARCHAR(50),
    product_count VARCHAR(50),
    can_whatsapp_feedback TINYINT DEFAULT 0,
    referral_code VARCHAR(50),
    referred_by VARCHAR(50),
    heard_from VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Admin Panel (admin.php)
Password-protected page showing:
- Total signups, today's signups
- Country breakdown
- Top problems (ranked by frequency)
- Pricing willingness distribution
- Beta testers count
- Source breakdown (how they heard about us)
- Full table with search/filter
- CSV export button

## 6. Language Support
- Three language files: `lang/en.php`, `lang/sw.php`, `lang/fr.php`
- Language selector at top of page.
- Auto-detect from browser `Accept-Language` header.
- Store preference in cookie.

# WhatsApp Commerce Catalog Setup Guide

## What This Guide Covers

This guide walks you through setting up a **Meta Commerce Catalog** so your products appear as rich product cards and carousels inside WhatsApp.

### Once set up, your WhatsApp bot sends:
- **Product Carousel** — up to 10 scrollable product cards with images, prices, and "View" buttons
- **Single-Product Message** — one product with image, price, and "View" button
- **Catalog Link** — a button that opens your full catalog inside WhatsApp

### Without catalog:
- Text-only list messages (no images, truncated titles)
- Still functional, but less visual

---

## Prerequisites

Before starting, make sure you have:

1. A **Meta Business Manager** account ([business.facebook.com](https://business.facebook.com))
2. A **WhatsApp Business Account (WABA)** connected to your Meta Business Manager
3. A **business phone number** registered on the WABA
4. **Admin access** to the Meta Business Manager
5. WhatsApp connected in Chatevo (**Settings → WhatsApp**)

---

## Part 1: Create Your Commerce Catalog

### Step 1 — Go to Commerce Manager
1. Log in to [business.facebook.com](https://business.facebook.com)
2. From the top menu, click the **Apps** icon (grid icon) → **Commerce Manager**
   - Or go directly to: [business.facebook.com/commerce](https://business.facebook.com/commerce)

### Step 2 — Create a New Catalog
1. Click **Add Catalog** button
2. Select **E-Commerce** as the catalog type (or "Sell products on Facebook and Instagram")
3. Click **Next**

### Step 3 — Configure Catalog Settings
1. **Upload Method**: Choose **Upload product info** (manual upload via CSV/data feed)
2. **Owner**: Select your Meta Business Manager account (the dropdown under "Owner")
3. **Catalog Name**: Give it a name like "My Store Catalog"
4. Click **Create**

**What you get:** A `catalog_id` (a long number). Save this — you'll need it in Chatevo settings.

### Step 4 — (Optional) Add Collaborators
If you want Chatevo (as a partner) to manage your catalog on your behalf:
1. In **Commerce Manager**, go to **Settings** → **Collaborators**
2. Click **Add Partner** and enter the partner's Business Manager ID
3. Assign the **Manage catalog** permission

---

## Part 2: Add Products to Your Catalog

There are **three ways** to add products. Start with Method A (simplest), then upgrade to Method B or C when you have many products.

### Method A: Manual Entry (Best for <20 Products)

1. In **Commerce Manager**, click **Catalog** → **Items** in the left sidebar
2. Click **Add Items** → **Add Items Manually**
3. Fill in the required fields for each product:

| Field | Required | What to Put |
|-------|----------|-------------|
| Product Name | Yes | Product title (e.g., "Classic Door Lock") |
| Price | Yes | Price with currency (e.g., "15.00 USD") — can use KES, NGN, etc. |
| Description | Yes | Short product description |
| Image URL | Yes | Public URL to product photo (must be https and accessible) |
| Link | Yes | URL to your store page for this product |
| Category | Yes | Google product category (search in the dropdown) |
| Brand | Yes | Your store/brand name |
| Condition | Yes | "New", "Used", or "Refurbished" |
| Retailer ID | Yes | A **unique ID** for this product — use the Chatevo product ID |

4. Click **Save** for each product

### Method B: CSV/Data Feed Upload (Best for 20-5000 Products)

1. In **Commerce Manager** → **Catalog** → **Items**
2. Click **Add Items** → **Data Feed** → **Download Template**
3. Fill in the spreadsheet with required columns: `id`, `title`, `description`, `availability`, `condition`, `price`, `link`, `image_link`, `brand`, `google_product_category`
4. Upload the file and wait for processing

### Method C: Chatevo Auto-Sync (Zero Manual Work)

Chatevo can push products to your Meta catalog automatically using the **Meta Catalog Batch API**.

**How it works:**
1. Every time you add/edit/delete a product in Chatevo, the app calls the Meta Batch API
2. You don't need to touch spreadsheets or Commerce Manager

**To enable this:**
1. You need a **Meta System User** access token with `catalog_management` permission
2. Set `wa_catalog_id` and `meta_business_id` in your Chatevo organization settings
3. Chatevo developers enable the Meta catalog sync feature in your account settings

---

## Part 3: Connect the Catalog to WhatsApp

Once your catalog has products, connect it to your WhatsApp Business Account.

### Step 1 — Go to WhatsApp Manager
1. Go to [business.facebook.com](https://business.facebook.com)
2. Click **Apps** icon → **WhatsApp Manager** (or go directly to `business.facebook.com/wa-manager`)
3. Select your WhatsApp Business Account

### Step 2 — Link the Catalog
1. In the left sidebar, under **Account Tools**, click **Catalog**
2. Click **Add Catalog**
3. Select the catalog you created in Part 1
4. Click **Save**

### Step 3 — Enable Commerce Features
1. In the left sidebar, under **Phone Numbers**, select your business phone number
2. Scroll to **Commerce Settings**
3. Enable **Show catalog on business profile** — this adds a "View Store" button on your WhatsApp profile
4. Enable **Shopping cart** — allows customers to add-to-cart within WhatsApp
5. Save changes

### Step 4 — Verify
Open WhatsApp on your phone, go to your business profile. You should see a **Shop** or **View Catalog** button with your products.

---

## Part 4: Configure in Chatevo

### Step 1 — Set Catalog ID and Business ID
In your Chatevo dashboard (**Settings → WhatsApp**), set:
- **Meta Business ID** — your Meta Business Manager ID
- **Catalog ID** — the catalog_id from Part 1, Step 3

These fields are stored in your organization record:
- `organizations.meta_business_id`
- `organizations.wa_catalog_id`

### Step 2 — Category Mapping
Your Chatevo categories (e.g., "Locks", "Doors") need to map to Google Product Categories for Meta.

In **Settings → Store**, set the category mapping JSON:
```json
{
  "Locks": "603",
  "Doors": "603",
  "Accessories": "6700",
  "Furniture": "436",
  "Electronics": "222"
}
```

Find Google Product Category IDs at: [Google Product Taxonomy](https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt)

### Step 3 — Sync Products
If using auto-sync (Method C), products sync automatically when you add/edit them.

If using manual/CSV methods, products are already in the catalog from Part 2.

---

## Part 5: How Carousels Work in the Bot

Once catalog is configured, the WhatsApp bot automatically uses carousels:

```
Customer: "Hi"
Bot: [Welcome card with Start Shopping button]

Customer: [taps Start Shopping]
Bot: [Browse Products / View Cart / My Orders]

Customer: [taps Browse Products]
Bot: [Category list]

Customer: [taps a category]
Bot: ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ Product A │ │ Product B │ │ Product C │
     │ $15      │ │ $22      │ │ $35      │
     │ [View]   │ │ [View]   │ │ [View]   │
     └──────────┘ └──────────┘ └──────────┘
       ← scrollable horizontal cards →

Customer: [taps a card]
Bot: [Product detail with image, price, Add to Cart button]
```

### Without Catalog
If catalog is not configured, the bot falls back to text-only list messages:
```
Customer: [taps a category]
Bot: "Select a product:
      1. Product A - $15
      2. Product B - $22
      ..."
```

---

## Limits

| Message Type | Max Products | Images | Requires Catalog |
|-------------|-------------|--------|-----------------|
| Carousel | 2-10 cards | Yes | Yes |
| List Message | 10 per section | No | No |
| Button Message | 3 buttons | Optional | No |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Catalog not visible in WhatsApp" | Make sure catalog is connected to WABA (Part 3, Step 2) and commerce settings enabled (Part 3, Step 3) |
| "Products not showing in carousel" | Check Diagnostics tab in Commerce Manager. Images must be publicly accessible https URLs |
| "Invalid product retailer ID" | The `product_retailer_id` must exactly match the `id` in your catalog |
| "Row title is too long" | Chatevo auto-truncates to 24 chars — make sure you've deployed latest code |
| Carousels not showing | Check that `wa_catalog_id` and `meta_business_id` are set in your org settings |

---

## Checklist

- [ ] Meta Business Manager account created
- [ ] Commerce Catalog created (got `catalog_id`)
- [ ] At least one product added to catalog with images
- [ ] Catalog connected to WhatsApp Business Account (Part 3)
- [ ] Commerce settings enabled for phone number
- [ ] `meta_business_id` set in Chatevo org settings
- [ ] `wa_catalog_id` set in Chatevo org settings
- [ ] Category mapping configured
- [ ] Test: send "Hi" to bot → browse → category → carousel should appear with images

---

## Glossary

| Term | Meaning |
|------|---------|
| WABA | WhatsApp Business Account |
| Catalog ID | Meta's identifier for your product catalog (numeric) |
| Product Retailer ID | Your own ID for a product (matches Chatevo product ID) |
| Google Product Category | Standard taxonomy ID for product types |
| Batch API | API to create/update products in catalog programmatically |
| Commerce Manager | Meta dashboard to manage catalogs |
| Carousel | Horizontal scrollable product cards in WhatsApp |

# WhatsApp Commerce Catalog Setup Guide

## What This Guide Covers

This guide walks you through setting up a **Meta Commerce Catalog** so your products appear as rich product cards and carousels inside WhatsApp.

### Once set up, your WhatsApp bot can send:
- **Product Carousel** — up to 10 scrollable product cards in one message
- **Single-Product Message** — one product with image, price, and "View" button
- **Multi-Product Message** — up to 30 products grouped into sections
- **Catalog Link** — a button that opens your full catalog inside WhatsApp

---

## Prerequisites

Before starting, make sure you have:

1. A **Meta Business Manager** account (business.facebook.com)
2. A **WhatsApp Business Account (WABA)** connected to your Meta Business Manager
3. A **business phone number** registered on the WABA
4. **Admin access** to the Meta Business Manager

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

**What you get:** A `catalog_id` (a long number). Save this — you'll need it later.

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
| GTIN / MPN | No | Barcode (optional) |

4. Click **Save** for each product

### Method B: CSV/Data Feed Upload (Best for 20-5000 Products)

This is the fastest bulk method. You upload a spreadsheet.

#### Step 1 — Download the Template
1. In **Commerce Manager** → **Catalog** → **Items**
2. Click **Add Items** → **Data Feed**
3. Click **Download Template**
4. Open the file (it's a TSV/CSV file)

#### Step 2 — Fill in the Spreadsheet
Open the template in Google Sheets or Excel. Required columns:

| Column | Example |
|--------|---------|
| `id` | `abc123` (use your Chatevo product ID) |
| `title` | `Premium Steel Door Lock` |
| `description` | `High-security lock for main doors` |
| `availability` | `in stock` |
| `condition` | `new` |
| `price` | `15.00 USD` |
| `link` | `https://yourstore.com/product/lock` |
| `image_link` | `https://yourstore.com/images/lock.jpg` |
| `brand` | `Your Brand` |
| `google_product_category` | `Hardware > Locks & Keys` |

**Important:** The category in this spreadsheet is Meta's Google Product Category. This is separate from your Chatevo app categories (see Part 4 for mapping).

#### Step 3 — Upload the File
1. In the Data Feed screen, click **Upload File**
2. Select your completed CSV/TSV file
3. Set a **schedule** (e.g., Daily) or choose **No schedule** for one-time upload
4. Click **Upload**
5. Wait for processing (may take a few minutes)
6. Check the **Diagnostics** tab for any errors

#### Step 4 — Set Up Auto-Sync (Optional)
If you select **Scheduled** upload:
- Choose **Daily** or **Weekly**
- Provide a **file URL** where your CSV lives (must be publicly accessible)
- Meta will fetch it automatically on the schedule

### Method C: Chatevo Auto-Sync (Best for Merchants Who Want Zero Manual Work)

Chatevo can push products to your Meta catalog programmatically using the **Meta Catalog Batch API**. This requires a one-time developer setup.

**How it works:**
1. Every time you add/edit/delete a product in Chatevo, the app automatically calls the Meta Batch API to update the catalog
2. You don't need to touch spreadsheets or Commerce Manager

**To enable this:**
1. You need a **Meta System User** access token with `catalog_management` permission
2. Chatevo needs your `catalog_id` (from Part 1, Step 3)
3. Chatevo developers enable the Meta catalog sync feature in your account settings

**The API call looks like this** (for reference):
```bash
curl -X POST https://graph.facebook.com/v25.0/{catalog_id}/items_batch \
  -H "Authorization: Bearer {access_token}" \
  -F 'item_type=PRODUCT_ITEM' \
  -F 'requests=[
    {
      "method": "CREATE_OR_UPDATE",
      "data": {
        "id": "chatevo_product_id",
        "title": "Premium Steel Door Lock",
        "description": "High-security lock",
        "price": "15.00 USD",
        "image_link": "https://...",
        "link": "https://...",
        "availability": "in stock",
        "brand": "Your Brand",
        "condition": "new"
      }
    }
  ]'
```

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

## Part 4: Category Mapping (Chatevo ↔ Meta Catalog)

Your Chatevo dashboard uses **your own categories** (e.g., "Locks", "Doors", "Accessories").
Meta's catalog uses **Google Product Categories** (a standardized taxonomy).

### How They Connect
- When Chatevo sends a product carousel, it groups products by your Chatevo categories
- Each product in the Meta catalog has a `google_product_category` field

### The Mapping Table
In the Chatevo settings, you can set up a mapping like this:

| Your Chatevo Category | Meta Google Product Category ID |
|-----------------------|--------------------------------|
| Locks | 603 (Hardware) |
| Doors | 603 (Hardware) |
| Accessories | 6700 (Home Accessories) |
| Furniture | 436 (Furniture) |
| Electronics | 222 (Electronics) |

### How to Find Google Product Category IDs
1. Go to: [www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt](https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt)
2. Search for your product type
3. Copy the numeric ID next to the category name

### Automatic Sync
Once mapping is configured:
- When you add a product with category "Locks" in Chatevo → it gets uploaded to Meta catalog with `google_product_category = 603`
- When the WhatsApp bot sends a "browsing_locks" carousel → it pulls products tagged with "Locks" from the catalog

---

## Part 5: Use Catalogs in WhatsApp Messages

### How Product Carousels Work

```
Customer: "Show me locks"
Bot sends carousel with 5 lock products:
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Lock A   │ │ Lock B   │ │ Lock C   │
│ $15      │ │ $22      │ │ $35      │
│ [View]   │ │ [View]   │ │ [View]   │
└──────────┘ └──────────┘ └──────────┘
  ← scrollable →
```

### Limits
- **Carousel**: 2–10 products per message
- **Multi-Product Message**: Up to 30 products in sections
- **Each product card** shows: image, title, price, description (auto-pulled from the catalog)

### Sending Types in Chatevo

Once catalog is connected and products are synced, the Chatevo bot can:

1. **Category Carousel** — When a customer picks a category, bot shows a carousel of those products
2. **New Arrivals Carousel** — Bot shows newest 10 products
3. **Single Product** — When browsing individual product details, shows as a catalog card

### Message Format

The WhatsApp API message for a carousel looks like this:

```json
{
  "messaging_product": "whatsapp",
  "to": "2547XXXXXXXXX",
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "🔒 Our Security Locks"
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "product",
          "action": {
            "product_retailer_id": "product_id_1",
            "catalog_id": "123456789"
          }
        },
        {
          "card_index": 1,
          "type": "product",
          "action": {
            "product_retailer_id": "product_id_2",
            "catalog_id": "123456789"
          }
        }
      ]
    }
  }
}
```

Note: `product_retailer_id` is the `id` you set in the catalog (should match your Chatevo product ID).

---

## Part 6: End-to-End Flow Example

Here's what the full customer experience looks like once everything is set up:

```
Customer texts: "Hi"

Bot: "Welcome to ABC Hardware!
      What would you like to do?
      [🛒 Start Shopping]"

Customer taps Start Shopping

Bot: "Our Categories:
      • Locks
      • Doors
      • Accessories"

Customer: "Locks"

Bot sends a CATALOG CAROUSEL:
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Steel    │ │ Brass    │ │ Smart    │
  │ Lock     │ │ Lock     │ │ Lock    │
  │ $15      │ │ $22      │ │ $45      │
  │ [View]   │ │ [View]   │ │ [View]   │
  └──────────┘ └──────────┘ └──────────┘

Customer taps a card → WhatsApp shows
full product details from the catalog.
Customer can add to cart directly.

Bot: "Added to cart! Want to checkout?"
[View Cart] [Continue Shopping]
```

---

## Troubleshooting

### "Catalog not visible in WhatsApp"
- Make sure catalog is **connected** to your WABA (Part 3, Step 2)
- Make sure **commerce settings** are enabled for your phone number (Part 3, Step 3)
- Wait up to 24 hours for changes to propagate

### "Products not showing in carousel"
- Check the **Diagnostics** tab in Commerce Manager for upload errors
- Make sure product images are **publicly accessible** (not localhost)
- Image URLs must use **https** (not http)

### "Invalid product retailer ID"
- The `product_retailer_id` in your message must exactly match the `id` field in your catalog
- Check for leading/trailing spaces or case differences

### "Batch API upload failed"
- Verify your access token has `catalog_management` permission
- Check that `item_type=PRODUCT_ITEM` is set correctly
- Make sure all required fields are present
- Keep requests under 3000 items per call

---

## Checklist

- [ ] Meta Business Manager account created
- [ ] Commerce Catalog created (got `catalog_id`)
- [ ] At least one product added to catalog
- [ ] Catalog connected to WhatsApp Business Account
- [ ] Commerce settings enabled for phone number
- [ ] Category mapping configured (Chatevo → Google categories)
- [ ] Chatevo auto-sync enabled (or CSV scheduled upload set up)
- [ ] Test message sent to verify product card appears in chat

---

## Glossary

| Term | Meaning |
|------|---------|
| WABA | WhatsApp Business Account — your business's WhatsApp account |
| Catalog ID | Meta's identifier for your product catalog (numeric) |
| Product Retailer ID | Your own ID for a product (should match Chatevo product ID) |
| Google Product Category | Standard taxonomy ID for product types |
| Batch API | API to create/update products in catalog programmatically |
| Data Feed | CSV/TSV file uploaded to populate catalog |
| Commerce Manager | Meta dashboard to manage catalogs |

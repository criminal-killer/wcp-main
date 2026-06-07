# How to Set Up Facebook / Meta Catalog for Your WhatsApp Store

This guide walks you through connecting your Chatevo store to Meta's **Commerce Catalog** so your customers can see **product images with prices** directly in WhatsApp.

**Without this setup:** Customers see product names in a text list, then see the image after tapping a product.  
**With this setup:** Customers see product cards with images and prices right in the chat — like flipping through a catalog on their phone.

---

## What You Need Before Starting

- A Facebook personal account (you probably have one)
- The email you used to sign up for Chatevo
- About 20–30 minutes
- Your phone (to receive verification codes)

---

## Step 1: Create a Meta Business Account

If you already have one, skip to Step 2.

1. Go to **https://business.facebook.com/overview**
2. Click **Create Account** in the top-right corner
3. Enter your **business name**, **your name**, and **your email**
4. Click **Next** and follow the prompts
5. Check your email for a confirmation code and enter it

After this, you'll have a Meta Business account. Think of this as your company's ID card for all Facebook/Meta services.

---

## Step 2: Create a WhatsApp Business Account (WABA)

This links your WhatsApp number to Meta.

1. Go to **https://business.facebook.com/wa/manage**
2. Click **Add Phone Number**
3. Choose one of the two options:

   - **Option A:** If you already have a Chatevo WhatsApp number set up, select **Use existing WhatsApp Business Account** and skip to Step 3
   - **Option B:** Click **Get Started** → **Create New Account**
     - Enter your **business name** and **WhatsApp phone number**
     - You'll receive a verification code on WhatsApp or SMS — enter it
     - Done

After creating, you'll see a **WhatsApp Manager** dashboard. This is where you manage your WhatsApp business number.

---

## Step 3: Create a Commerce Catalog

Think of this as your product inventory on Meta's servers. This is what WhatsApp will use to show product images in the chat.

1. Go to **https://commerce.facebook.com**
2. Click **Get Started** (or **Add Catalog** if you've used this before)
3. Select **E-Commerce** (for physical products) or **Services**
4. Click **Next**
5. Give your catalog a name — e.g. "My Store Products"
6. Select your business account from the dropdown
7. Click **Create**

Now you have an empty catalog. Next we'll connect it to WhatsApp.

---

## Step 4: Link Your Catalog to WhatsApp

1. In Commerce Manager (https://commerce.facebook.com), click **Settings** in the left sidebar
2. Click **Channels** → **Add Channel**
3. Select **WhatsApp**
4. Choose your WhatsApp Business Account from the dropdown
5. Click **Add**

The catalog is now connected to WhatsApp.

---

## Step 5: Find Your IDs

You need two IDs to enter in Chatevo settings.

### A) Find your Catalog ID

1. In Commerce Manager (https://commerce.facebook.com), go to **Settings** → **Business Assets**
2. Under **Catalogs**, find your catalog name
3. Click on it — the **Catalog ID** is the long number shown (e.g. `1234567890123456`)
4. Copy this number

### B) Find your Meta Business ID

1. Go to **https://business.facebook.com/settings**
2. On the left sidebar, click **Business Info**
3. Look for **Business ID** — it's another long number (e.g. `9876543210987654`)
4. Copy this number

### WARNING ⚠️

> These are just numbers, not passwords. Keep them safe but don't worry — they're not secret keys.

---

## Step 6: Enter IDs in Chatevo

1. Log in to your Chatevo dashboard
2. Go to **Settings** → **WhatsApp Integration**
3. Find these two fields:
   - **WhatsApp Catalog ID** → paste your Catalog ID from Step 5A
   - **Meta Business ID** → paste your Business ID from Step 5B
4. Click **Save**

---

## Step 7: Sync Your Products

Once the IDs are saved, Chatevo will automatically sync your products to Meta's catalog. This happens when you:

- Add a new product
- Edit a product
- Delete a product

To do an initial sync of ALL your existing products:

1. Go to **Settings** → **Catalog Sync**
2. Click **Sync All Products Now**
3. Wait 30–60 seconds
4. You'll see "Sync complete: X products synced"

---

## Step 8: Test It

1. Open WhatsApp and message your store number
2. Type **"start"** or **"menu"**
3. Tap **Browse Products**
4. Select a category

If everything is set up correctly, you'll see product cards with **images and prices** instead of just a text list.

---

## Troubleshooting

### "Catalog not configured" error in logs
→ You haven't entered the IDs in Step 6. Go back and check.

### Products show as text list, not cards
→ Double-check your Catalog ID and Business ID in Step 6.  
→ Make sure you clicked **Sync All Products Now** in Step 7.  
→ Wait 5 minutes after syncing — Meta takes time to process.

### Sync shows "error" or fails
→ Make sure your products have **images** uploaded (products without images won't sync)  
→ Make sure products have a **price** set  
→ Try syncing again after fixing

### "Your request has violated JSON schema" in logs
→ This means there's a bug in the message format. Contact support.

---

## One Final Thing

The product images customers see in WhatsApp come from **Meta's servers**, not directly from your website. So after syncing:

- If you **change a product image**, sync again
- If you **change a price**, sync again
- If you **add a new product**, it syncs automatically

Chatevo handles most of this automatically in the background.

---

**Still stuck?** Contact Chatevo support with your **Business ID** and **Catalog ID** ready.

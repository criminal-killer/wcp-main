# WhatsApp Business Connection

## Video Tutorial
> 📺 **Video coming soon** — 4-5 minutes
> [Watch on YouTube: Setting Up WhatsApp Business](#)

---

## Prerequisites

- A **WhatsApp Business Account** (not regular WhatsApp)
- A **Meta Business Account** (free to create)
- A phone number dedicated to your business (can be new or existing)

---

## Step 1: Create Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Choose **Business** type
4. Name your app: "Chatevo Store"
5. Add **WhatsApp** product to your app

## Step 2: Get Your Credentials

In the WhatsApp setup, you'll get:
- **Phone Number ID** — Used to send/receive messages
- **WhatsApp Business Account ID** — Your business identifier
- **App Secret** — Used for webhook verification

## Step 3: Connect in Chatevo

1. Go to **Settings** → **WhatsApp** in your dashboard
2. Enter:
   - **Phone Number ID** (from Meta)
   - **Access Token** (from Meta)
3. Click **Test Connection**

## Step 4: Verify Webhook

Meta needs to verify your webhook URL:
1. In Meta Developer Console, set **Callback URL** to:
   ```
   https://chatevo-app.vercel.app/api/webhook
   ```
2. Set **Verify Token** to a random string you choose
3. Add this same token to Chatevo settings

---

## Getting Your Access Token

1. In Meta Developer Console → WhatsApp → Basic Settings
2. Find **Access Token** (or generate a permanent one)
3. Copy and paste into Chatevo

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not verifying | Make sure verify token matches in both places |
| Messages not sending | Check if phone number is verified in Meta |
| Access token expired | Generate a permanent token in Meta |

---

## Need More Help?

- [Meta WhatsApp Business Documentation](https://developers.facebook.com/docs/whatsapp)
- Email: mazaoedu@gmail.com

---

## Next Steps

- [Add Products](../guides/product-management.md) →
- [Set Up Payments](../guides/payment-setup.md) →

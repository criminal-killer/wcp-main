# Product Management

## Video Tutorial
> 📺 **Video coming soon** — 2-3 minutes
> [Watch on YouTube: Adding Products](#)

---

## Adding Products

1. Go to **Products** in your dashboard
2. Click **Add New Product**
3. Fill in details:
   - **Name** (required)
   - **Price** (required)
   - **Category** (e.g., Electronics, Fashion, Food)
   - **Description** (optional but recommended)
   - **Images** (up to 5)

## Product Fields Explained

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Product title shown to customers |
| Price | Yes | Price in your store currency |
| Category | Yes | Helps customers browse |
| Description | No | Details about the product |
| Images | No | Up to 5 product images |
| Inventory | No | Stock count (optional) |
| Compare At Price | No | Shows "was" price (sale display) |

## Product Types

### Physical Products
Standard products that require delivery:
- Clothing, electronics, food, etc.
- Customer provides delivery address
- Shipping calculated at checkout

### Digital Products
Products delivered instantly:
- E-books, templates, software, etc.
- **Add download link/code** in the `digital_content` field
- Customer receives link after payment confirmation

### Services
Booked appointments or services:
- Set `booking_required: true`
- Customer selects available time
- Payment before appointment confirmation

## Managing Inventory

Go to **Products** → Click on a product:
- Update stock count manually
- Or enable **Low Stock Alerts** to get notifications

## Bulk Upload

For stores with many products, use CSV upload:
1. Export your product list
2. Add/edit products in spreadsheet
3. Upload CSV back to Chatevo

---

## Tips for Better Sales

1. **Use clear product names** — "Blue Cotton T-Shirt" not "Tshirt B"
2. **Add descriptions** — Tell customers about size, material, care
3. **Show variations** — Color, size options as separate products
4. **Use quality images** — Good photos increase conversions

---

## Next Steps

- [Set Up Payments](payment-setup.md) →
- [Customize AI Assistant](ai-customization.md) →

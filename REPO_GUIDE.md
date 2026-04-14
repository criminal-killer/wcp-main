# Sella Platform — Repository Deployment Guide (CRITICAL)

> [!CAUTION]
> **This is a multi-repo project with a shared local structure.** 
> Use this guide to ensure you are pushing the correct folder to the correct GitHub remote. 
> FAILURE TO FOLLOW THIS WILL CAUSE DEPLOYMENT CONTAMINATION (e.g., storefront showing on admin site).

---

## 🏗️ Repository Mapping

| Local Folder | Remote Name | GitHub Repository | Production URL | Content |
|--------------|-------------|-------------------|----------------|---------|
| `(root)` | `wcp-main` | `criminal-killer/wcp-main` | (Workflows/Marketing) | Marketing Workflows & Global Context |
| `wacommerce/admin-panel` | `origin` | `criminal-killer/adm-pan` | `adm-pan.vercel.app` | **Management Dashboard** (Waitlist, User Stats) |
| `wacommerce/phase-2-app` | `phase-2` | `criminal-killer/Phase-2-app` | `sella-app.vercel.app` | **Merchant App & Bot** (Products, Orders, Inbox) |

---

## 🚀 Deployment Workflow (Manual Sync)

To avoid contamination, do **NOT** use `git subtree` without extreme caution. Instead, follow this manual synchronization process:

### 1. Syncing Admin Panel (`adm-pan.vercel.app`)
1. Enter the directory: `cd wacommerce/admin-panel`
2. Initialize a temporary git instance if needed.
3. Push ONLY this folder's contents to the `origin` remote on the `main` branch.

### 2. Syncing Phase-2 App (`sella-app.vercel.app`)
1. Enter the directory: `cd wacommerce/phase-2-app`
2. Initialize a temporary git instance if needed.
3. Push ONLY this folder's contents to the `phase-2` remote on the `main` branch.

### 3. Syncing Main Monorepo
1. Go to the root directory.
2. Push the entire structure (including marketing workflows) to `wcp-main`.

---

## 🛠️ Verification Checklist
- [ ] Check `adm-pan.vercel.app`: Should show "Platform Overview" (Admin Dashboard).
- [ ] Check `sella-app.vercel.app`: Should show "Sell Easy on WhatsApp" (Merchant Entry).
- [ ] Check `wcp-main`: Should contain `.github/workflows` for marketing.

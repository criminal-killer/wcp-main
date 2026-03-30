# SELLA — WhatsApp Commerce Platform (App Console)

> **Phase 2 MVP** · Sell products directly inside WhatsApp. Set up your store in 5 minutes.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Turso](https://img.shields.io/badge/Turso-SQLite-teal)](https://turso.tech)

---

## 🌟 What's New? (Sella Global)

We have upgraded the platform to support **Global Fulfillment** and **Granular Bot Personalization**.

### 🤖 Advanced Bot Customization
- **Style Presets**: Choose from 5+ professional menu styles (Minimal, Street, Corporate, Friendly, etc.).
- **Feature Toggles**: Enable/Disable AI search, category browsing, and cart visibility directly from the dashboard.
- **Brand Voice**: Custom system prompts to align the AI assistant with your brand persona.

### 📦 Global Fulfillment Infrastructure
- **Delivery Zones**: Create custom geographic zones with dedicated shipping fees.
- **Manual Payments**: Support for local bank transfers and M-Pesa Tills with automated proof-of-payment collection.
- **Smart Waitlist**: Automatic gating for international merchants with a centralized onboarding console.

---

## 📋 Feature Checklist

### ✅ Working (Phase 2 MVP)
- [x] **7-Day Trials** — Accelerated trial period for faster conversion.
- [x] **Geographic Gating** — IP-based merchant waitlisting.
- [x] **Authentication** — Clerk sign-up/sign-in with email OTP + Google OAuth.
- [x] **Onboarding** — 3-field store setup (name, country, business type).
- [x] **Product Management** — CRUD with support for Physical, Digital, and Service types.
- [x] **Order Management** — Manual payment verification with one-click fulfillment actions.
- [x] **WhatsApp Bot Engine** — Optimized shopping flow with Redis-backed state management.
- [x] **SaaS Subscription** — Global Stripe + Local Paystack billing.

---

## 🚀 Setup Guide

### prerequisites
- Node.js 18+
- [Turso](https://turso.tech) & [Upstash Redis](https://upstash.com)
- [Clerk](https://clerk.com) for Auth
- [Meta Developer Console](https://developers.facebook.com) for WhatsApp Cloud API

### Quick Start
```bash
npm install
npx drizzle-kit push
npm run dev
```

---

## 🎬 Demo Walkthrough

### 1. Configure Bot Style
1. Dashboard → Settings → WhatsApp Tab.
2. Select your preferred **Menu Style** and toggle **Emojis**.
3. Your WhatsApp bot updates instantly across all conversations.

### 2. Set Up Delivery Zones
1. Dashboard → Settings → Fulfillment Tab.
2. Define your operating zones and fees.
3. The bot will automatically ask customers for their zone and calculate the total.

### 3. Verify Payments
1. When a customer sends a payment proof, it appears in the **Order Detail**.
2. Review the proof and click **Mark as Paid** to trigger fulfillment.

---

## 🔐 Security
- **AES-256 Encryption**: All Meta Access Tokens and Payment Keys are encrypted at rest.
- **Signature Validation**: Strict X-Hub-Signature validation for all WhatsApp webhooks.
- **Multi-tenant Isolation**: Strict row-level security using `org_id` on every query.

---

Built with ❤️ for Global Micro-Entrepreneurs.

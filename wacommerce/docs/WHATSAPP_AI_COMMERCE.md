# Sella — WhatsApp AI Commerce Engine (Source of Truth)

This document serves as the complete technical and functional specification for the Sella WhatsApp AI-powered storefront. It defines how Sella bridges the gap between conversational social media and structured e-commerce.

---

## 🏗️ 1. The Core Architecture: The "Hybrid Engine"

Sella operates on a **Hybrid Engine** model to balance the speed of a structured checkout with the flexibility of a modern LLM.

### A. The State Machine (The "How")
Managed in `wacommerce/phase-2-app/lib/store-engine.ts`, this layer uses **Redis** to track a customer's journey.
*   **Real-time Cart**: Customer selections are stored in a Redis Hash (`cart:{orgId}:{phone}`). This prevents database bloat for abandoned carts.
*   **Flow Steps**: The customer "step" (e.g., `browsing_products`, `delivery_info`, `payment_select`) is tracked in Redis.
*   **Interactive UI**: We prioritize WhatsApp's **Interactive Buttons** and **List Messages** over plain text to minimize typing friction and user error.

### B. The Conversational AI (The "Why")
Managed in `wacommerce/phase-2-app/app/api/ai/chat/route.ts`. When a user types something that doesn't match a button or a step (e.g., "Do you have red shoes?"), the engine falls back to the **LLM Brain**.
*   **Context Injection**: Every AI request is injected with the store's **Name, Description, Currency,** and the **Top 20 Active Products**.
*   **Persona Tiers**: Merchants can choose between:
    *   **Sales**: Aggressive intent detection to convert chats to "Search" actions.
    *   **Support**: Patient, helpful, focused on shipping and policies.
    *   **Educator**: Explains how to use the shop clearly.
*   **Intent Detection**: The AI is instructed to return a structured JSON response (`{"action": "search", "query": "..."}`) if it detects a shopper's intent.

---

## 🌩️ 2. The Problem vs. Solution Matrix

Sella solves primary friction points for the "Social Merchant."

| Problem (Manual WhatsApp Sales) | Sella Solution (Automated AI Commerce) |
|---------------------------------|----------------------------------------|
| **Manual Cataloging**: Merchants must send multiple photos and track prices in their head. | **Automated Catalog**: Stores use Meta's List Messages for category/product selection. |
| **"Dead Air"**: Customers message at 11:00 PM, and the merchant is asleep. | **24/7 AI Sales**: The AI identifies product interest, searches the inventory, and helps the user build a cart immediately. |
| **Calculation Errors**: Tallying prices, delivery fees, and discounts by hand is slow and error-prone. | **Redis Totals**: Real-time cart calculation with automated delivery zone fees and metadata. |
| **Friction-Filled Checkout**: User has to type their address every time. | **Contextual Memory**: Sella remembers the customer's phone from `contacts` and saves delivery preferences. |
| **Unverified Payments**: High risk of "fake" payment screenshots in DMs. | **Payment Integration**: Automatic M-Pesa/Flutterwave status checks vs. manual flow logic. |

---

## 🛤️ 3. The Lifecycle of an Intelligent Message

1.  **Ingest**: `api/whatsapp/webhook` receives a JSON from Meta.
2.  **Verify**: `lib/redis` quickly fetches the `org` details (cached) to verify the phone ID.
3.  **Process**: `store-engine.ts` checks the Redis `flow_state`.
    *   *If Button Reply*: It immediately maps to a commerce function (e.g., `handleProductAction`).
    *   *If Plain Text*: It checks for "Global Keywords" (Menu, Cart, Back).
4.  **AI Fallback**: If no direct match exists, the AI is prompted with the current store context.
5.  **Search Loop**: If AI says "Search", Sella performs a database query on `products.name` and `category` and returns an interactive results list to the user.
6.  **Persistence**: Finalized orders are moved from Redis into Postgres (`orders` table) for merchant fulfillment.

---

## 🛠️ 4. Technical Constants (Recreation Guide)

*   **Database Schema (`lib/schema.ts`)**: Relies heavily on `organizations` and `products`.
*   **Stateful Memory**: Key format is `org:{orgId}:contact:{phone}`.
*   **Environment Variables Needed**: `GROQ_API_KEY`, `POSTGRES_URL`, `REDIS_URL`, `WHATSAPP_TOKEN`.

---

## 🌟 5. Summary: Why It Wins
Traditional bots are either too "stupid" (fixed buttons only) or too "loose" (AI that chats forever but never sells). **Sella wins by combining the two:** It uses AI to listen but keeps the user in a disciplined commerce flow to **close the sale.**

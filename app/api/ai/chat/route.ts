import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `
You are the **Sella Support Teacher** 🧑‍🏫. Your goal is to help merchants set up their WhatsApp store with zero stress!
Explanations should be very simple, friendly, and use lots of emojis like a lesson for a class 1 student. 🧸

### 🌟 Your Persona:
- Patient, encouraging, and clear.
- Use simple words. Instead of "Configure Webhook", say "Connect the bridge between Meta and Sella 🌉".
- Use emojis to highlight key points (🚀, 💡, ✅, ⚠️).

### 🛠️ The "Interactive Setup" Protocol:
If a user asks "How do I set up WhatsApp?", **ALWAYS** offer two choices:
1. **"The Full Guide"** 📚 (List all steps at once).
2. **"Step-by-Step"** 🐾 (We do one small part at a time. I explain Part 1, then wait for you to say "Done" before moving to Part 2).

### 📖 The 3-Part Setup (Step-by-Step):
**Part 1: The Meta House 🏠**
- Register on [Meta Developers](https://developers.facebook.com).
- Click "Create App" and choose "Other" -> "Business".
- Add the "WhatsApp" product.

**Part 2: The Phone Connection 📱**
- Add your business phone number.
- Get the **Phone Number ID** and **Access Token**.
- Go to Sella Dashboard -> Settings -> WhatsApp and paste them!

**Part 3: The Magic Bridge 🌉 (Webhook)**
- Go back to Meta -> WhatsApp -> Configuration.
- Paste this Webhook URL: \${process.env.NEXT_PUBLIC_APP_URL}/api/webhook
- Use the Verify Token: \${process.env.WA_WEBHOOK_VERIFY_TOKEN || 'sella-webhook-verify'}
- ✅ **CRITICAL**: In "Webhook Fields", click **Manage** and subscribe to "**messages**".

---

### 💳 Billing & Referrals (Support Mode):
- **Free Trial**: Every new store starts with a **7-Day Free Trial** 🎁.
- **Plans**: 
  - **Starter**: Perfect for beginners! ($0/mo)
  - **Pro**: For growing stores. ($29/mo)
  - **Elite**: For power sellers! ($99/mo)
- **Referrals**: If you invite a friend using your referral link (in Settings), you earn **50% commission** on their subscription! 💸

### 📜 Tone Rules:
- Never use complex technical jargon without explaining it simply.
- If the user is lost, ask "Where did you get stuck? I'm here to help! 🧡".
- Encourage them: "You're doing great! Almost there! 👏".
`

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { message, org_id } = body

    if (!userId && !org_id) return new NextResponse('Unauthorized', { status: 401 })

    // Get user/org context
    let context = ""
    let targetOrgId = org_id

    if (userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.clerk_id, userId),
      })
      if (user) targetOrgId = user.org_id
    }

    if (targetOrgId) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, targetOrgId),
      })
      if (org) {
        context = `\nApplying context: The merchant is "${org.name}", using currency ${org.currency}. `
        if (org.description) context += `Store Description: ${org.description}. `
      }
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + context },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
    })

    const reply = completion.choices[0]?.message?.content || "I'm not sure how to respond to that. Can you rephrase?"

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({ 
      reply: "I'm experiencing a high volume of requests. Please try again or contact support at mazaoedu@gmail.com" 
    })
  }
}

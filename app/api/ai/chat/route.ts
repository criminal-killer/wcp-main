import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { db } from '@/lib/db'
import { users, organizations, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { decrypt } from '@/lib/encryption'

const PERSONA_PROMPTS = {
  educator: `
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

### 💳 Billing & Plans:
- **Free Trial**: Every new store starts with a **7-Day Free Trial** 🎁.
- **Plans**: 
  - **Starter**: Perfect for beginners! ($29/mo)
  - **Pro**: For growing stores. ($59/mo)
  - **Elite**: For power sellers! ($99/mo)
- **Referrals**: If you invite a friend using your referral link, you earn **50% commission** on their subscription! 💸
`,
  sales: `
You are a **Elite Sales Assistant** 💰 for this store on WhatsApp.
Your goal is to convert inquiries into orders. Be persuasive, helpful, and professional.

### 🎯 Sales Strategy:
- **Product Awareness**: Use the provided product list to suggest specific items.
- **Conversion**: If a user shows interest, explain how to add to cart or checkout.
- **Accuracy**: Only talk about products that are actually in the store's list.
- **Upselling**: Suggest complementary products if they ask about one.
`,
  support: `
You are a **Customer Support Specialist** 🛠️.
Your goal is to handle post-purchase inquiries, shipping questions, and store policies.

### 🛡️ Support Strategy:
- **Patience**: Be extremely helpful and empathetic.
- **Policies**: Refer to the store's description for shipping/return info if available.
- **Escalation**: If you can't solve a problem, suggest they wait for a human agent.
`
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { message, org_id } = body

    if (!userId && !org_id) return new NextResponse('Unauthorized', { status: 401 })

    let targetOrgId = org_id
    if (userId) {
      const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
      if (user) targetOrgId = user.org_id
    }

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, targetOrgId) })
    if (!org) return NextResponse.json({ reply: "Organization context not found." })

    // Build Context
    let context = `\nStore Context: Brand name is "${org.name}", currency is ${org.currency}. `
    if (org.description) context += `Description: ${org.description}. `

    // Inject Products for Sales Persona
    if (org.ai_persona === 'sales') {
      const activeProducts = await db.select().from(products).where(and(eq(products.org_id, org.id), eq(products.is_active, 1))).limit(20)
      if (activeProducts.length > 0) {
        context += `\nAvailable Products:\n${activeProducts.map(p => `- ${p.name}: ${org.currency} ${p.price} (${p.category})`).join('\n')}`
      }
    }

    const persona = (org.ai_persona as keyof typeof PERSONA_PROMPTS) || 'educator'
    const systemPrompt = (PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.educator) + context + (org.ai_system_prompt || '')

    // AI Provider Logic
    const provider = org.ai_provider || 'sella'
    let reply = ""

    if (provider === 'sella') {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
        model: 'llama-3.3-70b-versatile',
      })
      reply = completion.choices[0]?.message?.content || ""
    } else {
      // Custom AI Providers (OpenAI, Gemini, Claude, Custom)
      const apiKey = org.ai_api_key_encrypted ? decrypt(org.ai_api_key_encrypted) : ""
      if (!apiKey) throw new Error("Custom AI provider selected but no API key found.")

      let endpoint = ""
      let headers: Record<string, string> = { 'Content-Type': 'application/json' }
      let payload: any = { model: org.ai_model || 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }] }

      if (provider === 'google') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${org.ai_model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`
        payload = { contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nUser: " + message }] }] }
      } else if (provider === 'anthropic') {
        endpoint = "https://api.anthropic.com/v1/messages"
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        payload = { model: org.ai_model || 'claude-3-5-sonnet-20240620', max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: message }] }
      } else {
        // OpenAI or Custom
        endpoint = provider === 'custom' ? (org.ai_endpoint_url || "") : "https://api.openai.com/v1/chat/completions"
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      if (!endpoint) throw new Error("API endpoint missing for custom provider.")

      const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) })
      const data = await response.json()
      
      // Basic response parsing for OpenAI-compatible and specialty formats
      if (provider === 'google') reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      else if (provider === 'anthropic') reply = data.content?.[0]?.text
      else reply = data.choices?.[0]?.message?.content
    }

    return NextResponse.json({ reply: reply || "I'm having trouble processing that right now." })

  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({ 
      reply: "I'm experiencing a high volume of requests. Please try again or contact support at mazaoedu@gmail.com" 
    })
  }
}

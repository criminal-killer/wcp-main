import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { db } from '@/lib/db'
import { users, organizations, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { decrypt } from '@/lib/encryption'

const GENERAL_SYSTEM_PROMPT = `You are Chatevo AI, a friendly and helpful assistant for merchants using the Chatevo WhatsApp Commerce platform.

### Your Role:
- Help merchants with their Chatevo store questions
- Assist with setup, products, payments, AI settings, orders, and general platform questions
- Be concise, friendly, and practical

### How to respond:
- Keep responses short and helpful (2-4 sentences max unless detailed explanation is needed)
- If a user asks something unrelated to Chatevo (random questions, off-topic conversation, etc.), politely redirect them:
  "Hey! I'm here to help with your Chatevo store. What do you need help with today?"
- If you don't know something, say so honestly and suggest contacting support at mazaoedu@gmail.com
- Never pretend to be a "Teacher" or "Support Assistant" - just be helpful

### Platform Knowledge:
- Chatevo plans: Starter ($29/mo), Pro ($59/mo), Elite ($99/mo)
- Payments: Paystack (M-Pesa, card, bank), PayPal, Cash on Delivery
- WhatsApp Cloud API for message handling
- 7-day free trial for new merchants
- Referrals: earn 50% commission on referred merchants' subscriptions
- Product types: Physical, Digital (instant delivery), Services (bookings)

### Tone:
- Warm and friendly
- Use simple language
- Be practical and actionable
`

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

    // Inject Products if merchant wants sales-focused AI
    if (org.ai_persona === 'sales') {
      const activeProducts = await db.select().from(products).where(and(eq(products.org_id, org.id), eq(products.is_active, 1))).limit(20)
      if (activeProducts.length > 0) {
        context += `\nAvailable Products:\n${activeProducts.map(p => `- ${p.name}: ${org.currency} ${p.price} (${p.category})`).join('\n')}`
      }
    }

    const systemPrompt = GENERAL_SYSTEM_PROMPT + context + (org.ai_system_prompt || '')

    // AI Provider Gating
    const isPremium = ['pro', 'elite', 'custom'].includes(org.plan || '')
    const provider = (isPremium || org.ai_provider === 'Chatevo') ? (org.ai_provider || 'Chatevo') : 'Chatevo'
    
    let reply = ""

    if (provider === 'Chatevo') {
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


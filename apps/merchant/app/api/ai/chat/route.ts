export const dynamic = "force-dynamic"

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, products } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { logError, categorizeError } from '@/lib/error-logger'
import { createStoreAgent } from '@/mastra/agents/store-agent'

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
- Referrals: earn 40% commission on first subscription payment, then 10% recurring for 6 months
- Product types: Physical, Digital (instant delivery), Services (bookings)
- You have tools available to look up products, orders, analytics, and customers in real time.
- Use getProducts when the merchant asks about their products.
- Use getOrders/getOrder when they ask about orders.
- Use getAnalytics when they want store performance data.
- Use getContacts when they ask about customer information.
- Use updateSetting only when explicitly asked to change a setting.

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

    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    let targetOrgId: string | null = null
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (user) targetOrgId = user.org_id
    if (!targetOrgId) return NextResponse.json({ reply: "Organization context not found." })

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, targetOrgId) })
    if (!org) return NextResponse.json({ reply: "Organization context not found." })

    // Inject products into context if sales persona
    let enhancedPrompt = GENERAL_SYSTEM_PROMPT
    if (org.ai_persona === 'sales') {
      const activeProducts = await db.select().from(products).where(and(eq(products.org_id, org.id), eq(products.is_active, 1))).limit(20)
      if (activeProducts.length > 0) {
        enhancedPrompt += `\n\nNote: Your store has ${activeProducts.length} active products. Use getProducts tool to look them up when needed.`
      }
    }

    const agent = createStoreAgent({
      id: org.id,
      name: org.name,
      currency: org.currency || 'USD',
      description: org.description,
      ai_provider: org.ai_provider,
      ai_model: org.ai_model,
      ai_api_key_encrypted: org.ai_api_key_encrypted,
      ai_endpoint_url: org.ai_endpoint_url,
      ai_system_prompt: org.ai_system_prompt,
      ai_persona: org.ai_persona,
      plan: org.plan,
    }, enhancedPrompt)

    const response = await agent.generate(message)

    return NextResponse.json({
      reply: response.text || "I'm having trouble processing that right now.",
    })

  } catch (error: any) {
    console.error('AI Chat Error:', error)
    try { const info = categorizeError(error instanceof Error ? error : new Error(String(error))); await logError({ org_id: 'unknown', severity: info.severity, category: info.category, message: error instanceof Error ? error.message : String(error), cause: info.cause, fix: info.fix, stack: error instanceof Error ? error.stack : undefined }) } catch { /* */ }
    return NextResponse.json({
      reply: "I'm experiencing a high volume of requests. Please try again or contact support at mazaoedu@gmail.com"
    })
  }
}


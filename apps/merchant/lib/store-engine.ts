import { db } from '@/lib/db'
import { organizations, stores, contacts, conversations, products, orders, users } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { sendTextMessage } from '@/lib/whatsapp'
import { clearCart, setCartAbandoned, clearCartAbandoned as clearCartAbandonedState } from '@/lib/redis'

type RunnerOrg = typeof organizations.$inferSelect
type RunnerStore = typeof stores.$inferSelect
type RunnerContact = typeof contacts.$inferSelect
type RunnerConversation = typeof conversations.$inferSelect
type InboundMessage = {
  from: string; id: string; timestamp: string; type: string
  text?: { body: string }
  interactive?: {
    type: string
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
    product_item?: { product_retailer_id: string }
  }
}

interface EngineContext {
  org: RunnerOrg
  store: RunnerStore | null
  contact: RunnerContact
  conversation: RunnerConversation
  message: InboundMessage
  accessToken: string
}

const waConfig = (org: RunnerOrg, accessToken: string, store: RunnerStore | null = null) => ({
  phoneNumberId: store?.wa_phone_number_id || org.wa_phone_number_id || '',
  accessToken,
})

function parseInput(msg: InboundMessage): string {
  return (
    msg.text?.body?.trim() ||
    msg.interactive?.button_reply?.id ||
    msg.interactive?.list_reply?.id ||
    msg.interactive?.product_item?.product_retailer_id ||
    ''
  )
}

export async function processIncomingMessage(ctx: EngineContext) {
  const { org, store, contact, conversation, message, accessToken } = ctx
  const waConfigObj = waConfig(org, accessToken, store)
  const phone = contact.phone
  const orgId = org.id
  const inputRaw = parseInput(message).trim()
  const inputNorm = inputRaw.toLowerCase()

  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.com'}/store/${org.slug}`

  // === CANCEL / STOP ===
  if (['cancel', 'stop', 'exit'].includes(inputNorm)) {
    await clearCart(orgId, phone)
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: '   Session ended. Type *Hi* to start again.',
    })
  }

  // === MENU / HOME ===
  if (['menu', '0', '00'].includes(inputNorm)) {
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: `   *${org.name}*\n\nBrowse our catalog: ${storeUrl}\n\nNeed help? Just ask!`,
    })
  }

  // === PAYMENT CONFIRMATION (always check — survives flow reset) ===
  const paymentKeywords = ['paid', 'done', 'sent', 'completed', 'paid already', 'already paid', 'mpesa sent', 'transaction done', 'payment done', 'i have paid', 'paid via']
  const isPaymentConfirmation = paymentKeywords.some(kw => inputNorm.includes(kw))

  if (isPaymentConfirmation) {
    const orderMatch = inputRaw.match(/ORD-[A-Z0-9]+/i)
    let targetOrder = null

    if (orderMatch) {
      const pendingOrders = await db.select().from(orders)
        .where(and(eq(orders.org_id, orgId), eq(orders.contact_id, contact.id), eq(orders.payment_status, 'pending')))
      targetOrder = pendingOrders.find(o => o.order_number?.toUpperCase() === orderMatch[0].toUpperCase())
      if (!targetOrder) {
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: `Could not find a pending order with number *${orderMatch[0]}*. Please check the order number and try again.`,
        })
      }
    } else {
      const pendingOrders = await db.select().from(orders)
        .where(and(eq(orders.org_id, orgId), eq(orders.contact_id, contact.id), eq(orders.payment_status, 'pending')))
        .orderBy(orders.created_at)

      if (pendingOrders.length === 0) {
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: 'You have no pending orders. Browse our catalog at the link below and place a new order!\n\n' + storeUrl,
        })
      } else if (pendingOrders.length === 1) {
        targetOrder = pendingOrders[0]
      } else {
        const orderList = pendingOrders.map(o => ` • *${o.order_number}* — ${org.currency} ${Number(o.total).toLocaleString()}`).join('\n')
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: `You have multiple pending orders:\n${orderList}\n\nPlease reply with the order number, e.g., *paid ${pendingOrders[0].order_number}*`,
        })
      }
    }

    if (targetOrder) {
      await db.update(orders).set({
        payment_status: 'pending_approval',
        payment_reference: `manual_${Date.now()}`,
        updated_at: new Date().toISOString(),
      }).where(eq(orders.id, targetOrder.id))

      await clearCartAbandonedState(orgId, phone)

      try {
        const { sendPaymentPendingEmail } = await import('@/lib/email')
        const merchant = await db.query.users.findFirst({ where: eq(users.org_id, orgId) })
        if (merchant?.email) {
          const cartItems = JSON.parse(targetOrder.items || '[]') as Array<{ product_name: string; qty: number; price: number }>
          await sendPaymentPendingEmail(
            merchant.email, targetOrder.order_number || '', String(targetOrder.total),
            targetOrder.currency || 'KES', contact.name || 'Customer', phone,
            cartItems.map(i => ({ name: i.product_name, quantity: i.qty, price: i.price }))
          )
        }
      } catch (err) {
        console.error('[handlePayment] Failed to send merchant email:', err)
      }

      return await sendTextMessage(waConfigObj, {
        to: phone,
        body: `   *Payment Received!*\n\nYour order *${targetOrder.order_number}* has been submitted for verification.\n\nWe'll confirm your payment shortly. Thank you for your patience!`,
      })
    }
  }

  // === HI / HELLO — fresh start ===
  if (['hi', 'hello', 'hey', 'start'].includes(inputNorm)) {
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: `Hey there! Welcome to *${org.name}*   \n\nBrowse our catalog: ${storeUrl}\n\nOr just tell me what you're looking for — I'm here to help!`,
    })
  }

  // === AI HANDLES EVERYTHING ELSE naturally ===
  return await handleWithAI(waConfigObj, org, phone, inputRaw, contact, storeUrl)
}

async function handleWithAI(
  waConfig: { phoneNumberId: string; accessToken: string },
  org: RunnerOrg, phone: string, input: string, contact: RunnerContact, storeUrl: string,
) {
  try {
    const { createGroq } = await import('@ai-sdk/groq')
    const { Agent } = await import('@mastra/core/agent')
    const { createStoreTools } = await import('@/mastra/tools/store-tools')

    const tools = createStoreTools(org.id)

    const agent = new Agent({
      id: 'chatevo-ai',
      name: 'Chatevo AI',
      instructions: `You are Chatevo AI, the friendly WhatsApp assistant for "${org.name}".

CUSTOMER: ${contact.name || phone}
CURRENCY: ${org.currency || 'KES'}
STORE LINK: ${storeUrl}

GUIDELINES:
- Talk naturally like a real human. No scripts, no robotic greetings.
- Understand ANY language and reply in the same language the customer uses.
- Be concise (1-3 sentences usually), warm, and helpful.
- If the customer asks about products or what you sell, use the getProducts tool.
- If they ask about their order status, use the getOrder tool.
- When they want to buy something, send them the store link to browse and order.
- NEVER list products or show product details inside WhatsApp. Send the link instead.
- If something is unrelated to shopping, gently redirect back.
- Use emojis naturally but sparingly.`,
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })('llama-3.3-70b-versatile'),
      tools: {
        getProducts: tools.getProducts,
        getOrder: tools.getOrder,
      },
    })

    const response = await agent.generate(input, { maxSteps: 3 })
    const reply = response.text || ''

    return await sendTextMessage(waConfig, {
      to: phone,
      body: reply || 'Sorry, I didn\'t catch that. Type *Hi* to start again.',
    })
  } catch (err) {
    console.error('[ai-handler]', err)
    return await sendTextMessage(waConfig, {
      to: phone,
      body: `Sorry, I didn\'t catch that. Browse our catalog here: ${storeUrl}\n\nOr type *Hi* to start again.`,
    })
  }
}

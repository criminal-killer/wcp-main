import { createGroq } from '@ai-sdk/groq'
import { Agent } from '@mastra/core/agent'
import { createGreeterAgent } from './greeter-agent'

import { createContactTools } from '../tools/store-tools'
import { db } from '@/lib/db'
import { products, orders } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

type OrgConfig = {
  id: string
  name: string
  currency: string
  slug: string
}

type ContactInfo = {
  id: string
  name: string | null
  phone: string
}

const defaultModel = createGroq({ apiKey: process.env.GROQ_API_KEY })('llama-3.3-70b-versatile')

function classifyIntent(input: string, _contact: ContactInfo): string {
  const trimmed = input.trim().toLowerCase()
  const isGreeting = /^(hi|hello|hey|start|morning|evening|yo|howdy|sasa|jambo|hujambo|hola|ola|bonjour|hallo|hei)\b/i.test(trimmed)

  const hasProductQuery = /\b(buy|want|need|looking for|price|cost|how much|available|have you|sell|product|item)\b/i.test(trimmed)

  if (isGreeting && !hasProductQuery) return 'greeter'
  if (hasProductQuery) return 'sales'
  if (/\b(order|ORD-|tracking|delivery|shipped|status|cancel)\b/i.test(trimmed)) return 'support'
  if (/\b(paid|payment|money|mpesa|sent|done|completed|paid already)\b/i.test(trimmed)) return 'support'

  return 'sales'
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { KES: 'KSh ', TZS: 'TSh ', UGX: 'USh ', USD: '$', EUR: '€', GBP: '£' }
  return (symbols[currency] || currency + ' ') + amount.toLocaleString()
}

// Pre-execute a product search against the real DB based on user input
// Uses AND search first → OR fallback → all products fallback
async function searchProducts(input: string, orgId: string, currency: string, storeUrl: string): Promise<{ context: string; formatted: string } | null> {
  const baseConditions = [eq(products.org_id, orgId), eq(products.is_active, 1)]

  const trimmed = input.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const stopWords = new Set(['the','a','an','i','we','you','me','for','and','or','but','in','on','at','to','of','is','are','my','your','his','her','its','some','any','all','what','which','how','where','when','show','need','want','looking','buy','get','have','with','price','cost','much','available','sell','product','item','please','can','tell','about','like','would','could','there'])
  const words = trimmed.length > 2 ? trimmed.split(/\s+/).filter(w => !stopWords.has(w)) : []

  let results: any[] | null = null

  // 1) Try AND search
  if (words.length > 0) {
    const andClauses = words.map(w => sql`${products.name} LIKE ${'%' + w + '%'}`)
    const condition = andClauses.length === 1 ? andClauses[0] : sql`(${sql.join(andClauses, sql` AND `)})`
    results = await db.select({ id: products.id, name: products.name, price: products.price, category: products.category, inventory_count: products.inventory_count })
      .from(products).where(and(...baseConditions, condition)).limit(20)
  }

  // 2) Fallback to OR search
  if ((!results || results.length === 0) && words.length > 1) {
    const orClauses = words.map(w => sql`${products.name} LIKE ${'%' + w + '%'}`)
    const condition = sql`(${sql.join(orClauses, sql` OR `)})`
    results = await db.select({ id: products.id, name: products.name, price: products.price, category: products.category, inventory_count: products.inventory_count })
      .from(products).where(and(...baseConditions, condition)).limit(20)
  }

  // 3) Final fallback — no filter, just all products
  if (!results || results.length === 0) {
    results = await db.select({ id: products.id, name: products.name, price: products.price, category: products.category, inventory_count: products.inventory_count })
      .from(products).where(and(...baseConditions)).limit(20)
  }

  if (!results || results.length === 0) return null

  const byCategory = new Map<string, any[]>()
  for (const p of results) {
    const cat = p.category || 'Other'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(p)
  }

  const lines: string[] = [`Here are the products available at the store "${storeUrl.split('/').pop() || 'store'}":`]
  for (const cat of Array.from(byCategory.keys())) {
    const items = byCategory.get(cat)!
    lines.push(`\nCategory: ${cat}`)
    for (const p of items.slice(0, 5)) {
      const price = formatCurrency(p.price ?? 0, currency)
      const stock = p.inventory_count != null ? ` (${p.inventory_count} in stock)` : ''
      lines.push(`- ${p.name} : ${price}${stock}`)
    }
  }

  const total = results.length
  const count = total > 10 ? `${Math.min(total, 10)} of ${total}` : `${total}`
  lines.push(`\nFound ${count} products.`)
  lines.push(`Store link: ${storeUrl}`)

  return {
    context: JSON.stringify(results.map(p => ({ name: p.name, price: p.price, category: p.category, stock: p.inventory_count }))),
    formatted: lines.join('\n'),
  }
}

// Pre-execute an order lookup based on user input
async function findOrder(input: string, contactId: string, orgId: string, currency: string): Promise<string | null> {
  const orderMatch = input.match(/ORD-[A-Z0-9]+/i)
  let order

  if (orderMatch) {
    const conditions = [eq(orders.org_id, orgId),
      sql`UPPER(${orders.order_number}) = ${orderMatch[0].toUpperCase()}`
    ]
    order = await db.query.orders.findFirst({ where: and(...conditions) })
  }

  if (!order) {
    const pendingOrders = await db.select({
      id: orders.id, order_number: orders.order_number, total: orders.total,
      order_status: orders.order_status, payment_status: orders.payment_status,
      created_at: orders.created_at,
    }).from(orders)
      .where(and(eq(orders.org_id, orgId), eq(orders.contact_id, contactId)))
      .orderBy(desc(orders.created_at)).limit(5)

    if (pendingOrders.length === 0) return null
    return pendingOrders.map(o =>
      `${o.order_number} - ${o.order_status} - ${formatCurrency(o.total ?? 0, currency)} - ${o.payment_status}`
    ).join('\n')
  }

  const total = formatCurrency(order.total ?? 0, currency)
  let msg = `${order.order_number}\nStatus: ${order.order_status}\nTotal: ${total}\nPayment: ${order.payment_status}`
  if (order.delivery_address) msg += `\nDelivery: ${order.delivery_address}`
  return msg
}

function reviewResponse(text: string): string {
  let clean = text
    .replace(/<\|?function[^>]*>.*?<\/\|?function\s*>/gis, '')
    .replace(/<function[^>]*>[\s\S]*?<\/function>/gi, '')
    .replace(/<tool[^>]*>[\s\S]*?<\/tool>/gi, '')
    .replace(/```(?:json|xml|function)[\s\S]*?```/gi, '')
    .replace(/\[tool_call[^\]]*\]/gi, '')
    .replace(/\{["'](?:name|function)["']:.*?\}/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length < 5) clean = ''
  return clean
}

// Text-only generation: no tools passed to the model so it can't generate <function> tags
async function generateText(prompt: string, model: any, fallbackUrl: string): Promise<string> {
  const agent = new Agent({
    id: 'text-gen',
    name: 'Text Generator',
    instructions: `You are a friendly WhatsApp store assistant.
Reply in the same language the customer wrote in.
Be warm, concise (2-4 sentences), and natural.
If you have product data in the context, use it to give specific recommendations.
If asked about payment methods, explain: M-Pesa, credit/debit card, bank transfer, PayPal, Cash on Delivery.
If you don't have specific data, suggest browsing the store link.
Never output <function> tags, XML, or JSON. Just natural conversation.`,
    model,
  })
  const response = await agent.generateLegacy(prompt, { temperature: 0.7 })
  const cleaned = reviewResponse(response.text || '')
  if (!cleaned) return `You can browse our store here: ${fallbackUrl}`
  return cleaned
}

export async function routeToAgent(
  input: string,
  contact: ContactInfo,
  org: OrgConfig,
  storeUrl: string,
  history?: Array<{ role: string; text: string }>,
) {
  const model = defaultModel
  const contactTools = createContactTools(org.id, contact.id)
  const intent = classifyIntent(input, contact)

  // Build conversation history context
  let historyContext = ''
  if (history && history.length > 0) {
    const recent = history.slice(-4)
    historyContext = '\n\nPrevious messages:\n' + recent.map(h =>
      h.role === 'user' ? `Customer: ${h.text}` : `Assistant: ${h.text}`
    ).join('\n')
  }

  switch (intent) {
    case 'greeter': {
      // Greeter agent needs setContactName tool - it rarely generates <function> tags
      const agent = createGreeterAgent(model, contactTools)
      const response = await agent.generateLegacy(input, { temperature: 0.7 })
      return (response.text || '').trim() || `Welcome! Browse our store: ${storeUrl}`
    }

    case 'support': {
      const orderData = await findOrder(input, contact.id, org.id, org.currency || 'KES')
      const prompt = `Customer asks: "${input}"${historyContext}\n\nStore: ${org.name}\nCurrency: ${org.currency || 'KES'}\nStore link: ${storeUrl}\n\nOrder data:\n${orderData || 'No orders found for this customer.'}\n\nRespond helpfully. If no order data, suggest browsing the store.`
      return await generateText(prompt, model, storeUrl)
    }

    default: {
      const productData = await searchProducts(input, org.id, org.currency || 'KES', storeUrl)
      const prompt = `Customer asks: "${input}"${historyContext}\n\nStore: ${org.name}\nCurrency: ${org.currency || 'KES'}\nStore link: ${storeUrl}\n\n${productData ? `Product data:\n${productData.formatted}` : 'No products found matching their request. Suggest browsing the store link.'}\n\nRespond helpfully and naturally. If products were found, mention specific items. If not, invite them to browse.`
      return await generateText(prompt, model, storeUrl)
    }
  }
}

export { classifyIntent }
export type { OrgConfig, ContactInfo }

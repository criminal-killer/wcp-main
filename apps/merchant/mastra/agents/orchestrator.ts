import { createGroq } from '@ai-sdk/groq'
import { Agent } from '@mastra/core/agent'
import { createGreeterAgent } from './greeter-agent'
import { createSalesAgent } from './sales-agent'
import { createSupportAgent } from './support-agent'
import { createStoreTools, createContactTools } from '../tools/store-tools'
import { db } from '@/lib/db'
import { products, orders, contacts } from '@/lib/schema'
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

function classifyIntent(input: string, contact: ContactInfo): string {
  const hasName = !!contact.name
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

function buildProductsResponse(results: any[], storeUrl: string, currency: string): string {
  if (!results || results.length === 0) {
    return `I checked but I couldn't find anything matching what you're looking for. You can browse our full catalog here: ${storeUrl}`
  }

  const byCategory = new Map<string, any[]>()
  for (const p of results) {
    const cat = p.category || 'Other'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(p)
  }

  const lines: string[] = []
  const cats = Array.from(byCategory.keys())
  for (const cat of cats) {
    const items = byCategory.get(cat)!
    lines.push(`*${cat}:*`)
    for (const p of items.slice(0, 5)) {
      const price = formatCurrency(p.price ?? 0, currency)
      const stock = p.inventory_count != null ? ` (${p.inventory_count} left)` : ''
      lines.push(`• ${p.name} - ${price}${stock}`)
    }
    lines.push('')
  }

  const total = results.length
  const count = total > 10 ? `Showing ${Math.min(total, 10)} of ${total} products` : `Found ${total} products`
  lines.push(`${count}`)
  lines.push(`Browse the full catalog: ${storeUrl}`)

  return lines.join('\n')
}

function buildOrderResponse(order: any, currency: string): string | null {
  if (!order) return null
  const total = formatCurrency(order.total ?? 0, currency)
  let msg = `*Order ${order.order_number}*\nStatus: ${order.order_status}\nTotal: ${total}\nPayment: ${order.payment_status}`
  if (order.delivery_address) msg += `\nDelivery: ${order.delivery_address}`
  return msg
}

function buildOrdersResponse(results: any[], currency: string): string {
  if (!results || results.length === 0) return "You don't have any orders yet."
  return results.slice(0, 5).map(o => {
    const total = formatCurrency(o.total ?? 0, currency)
    return `*${o.order_number}* - ${o.order_status} - ${total}`
  }).join('\n') || "You don't have any orders yet."
}

async function executeFunctionCall(fnName: string, args: any, orgId: string, currency: string, storeUrl: string): Promise<string | null> {
  try {
    switch (fnName) {
      case 'getProducts': {
        const conditions = [eq(products.org_id, orgId), eq(products.is_active, 1)]
        if (args.search) conditions.push(sql`${products.name} LIKE ${'%' + args.search + '%'}`)
        if (args.category) conditions.push(eq(products.category, args.category))
        const results = await db.select({
          id: products.id,
          name: products.name,
          price: products.price,
          category: products.category,
          inventory_count: products.inventory_count,
        }).from(products).where(and(...conditions)).limit(args.limit || 20)
        return buildProductsResponse(results, storeUrl, currency)
      }

      case 'getOrder': {
        const conditions = [eq(orders.org_id, orgId)]
        if (args.orderId?.toUpperCase().startsWith('ORD-')) {
          conditions.push(eq(orders.order_number, args.orderId.toUpperCase()))
        } else {
          conditions.push(eq(orders.id, args.orderId))
        }
        const order = await db.query.orders.findFirst({ where: and(...conditions) })
        return buildOrderResponse(order, currency)
      }

      case 'getOrders': {
        const conditions = [eq(orders.org_id, orgId)]
        if (args.status) conditions.push(eq(orders.order_status, args.status))
        if (args.paymentStatus) conditions.push(eq(orders.payment_status, args.paymentStatus))
        if (args.daysBack) conditions.push(sql`${orders.created_at} >= datetime('now', '-' || ${args.daysBack} || ' days')`)
        const results = await db.select({
          id: orders.id,
          order_number: orders.order_number,
          total: orders.total,
          currency: orders.currency,
          order_status: orders.order_status,
          payment_status: orders.payment_status,
        }).from(orders).where(and(...conditions)).orderBy(desc(orders.created_at)).limit(args.limit || 10)
        return buildOrdersResponse(results, currency)
      }

      case 'getContacts': {
        const conditions = [eq(contacts.org_id, orgId)]
        if (args.search) conditions.push(sql`(${contacts.name} LIKE ${'%' + args.search + '%'} OR ${contacts.phone} LIKE ${'%' + args.search + '%'})`)
        const results = await db.select({
          name: contacts.name,
          phone: contacts.phone,
          total_orders: contacts.total_orders,
          total_spent: contacts.total_spent,
        }).from(contacts).where(and(...conditions)).orderBy(desc(contacts.last_order_at)).limit(args.limit || 20)
        if (!results || results.length === 0) return "I couldn't find any customers matching that."
        return results.slice(0, 5).map(c =>
          `${c.name || 'Unknown'} - ${c.phone} - ${c.total_orders || 0} orders`
        ).join('\n')
      }

      default:
        return null
    }
  } catch (err) {
    console.error(`[orchestrator] tool execution error: ${fnName}`, err)
    return null
  }
}

// Final safety net: strip any leftover function/XML artifacts from the response
// Also handles edge cases like partial tags or malformed function calls
function cleanResponse(raw: string): string {
  let text = raw.trim()

  // Strip <function...>...</function> blocks (any format)
  text = text.replace(/<function[\s\S]*?<\/function>/g, '')
  // Strip lone <function or </function> leftovers
  text = text.replace(/<function[^>]*>/g, '')
  text = text.replace(/<\/function>/g, '')
  // Strip any { and } pairs that look like JSON artifacts at the end
  text = text.replace(/\{["\w,\s:]+\}\s*$/, '')
  // Remove leading/trailing whitespace and empty lines
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}

export async function routeToAgent(
  input: string,
  contact: ContactInfo,
  org: OrgConfig,
  storeUrl: string,
  history?: Array<{ role: string; text: string }>,
) {
  const model = defaultModel
  const storeTools = createStoreTools(org.id)
  const contactTools = createContactTools(org.id, contact.id)

  const intent = classifyIntent(input, contact)

  let agent: Agent<any, any, any, any, any>

  switch (intent) {
    case 'greeter':
      agent = createGreeterAgent(model, contactTools)
      console.log(`[orchestrator] routing to Greeter agent for ${contact.phone}`)
      break
    case 'support':
      agent = createSupportAgent(org.name, org.currency, storeUrl, model, storeTools, history)
      console.log(`[orchestrator] routing to Support agent for ${contact.phone}`)
      break
    default:
      agent = createSalesAgent(org.name, org.currency, storeUrl, model, storeTools, history)
      console.log(`[orchestrator] routing to Sales agent for ${contact.phone}`)
      break
  }

  const response = await agent.generateLegacy(input, { maxSteps: 3, temperature: 0.7 })
  let text = (response.text || '').trim()

  // Handle <function> XML tags (Llama outputs these instead of proper tool calls)
  // The model outputs: <function=getProducts{...args...}</function> (no > before args)
  // Standard XML: <function=getProducts>json</function>
  const fnTag = /<function=(\w+)(?:\{([\s\S]*?)\}|>([\s\S]*?))<\/function>/
  const fnMatch = text.match(fnTag)
  if (fnMatch) {
    const fnName = fnMatch[1]
    const fnArgsStr = fnMatch[2] || fnMatch[3]
    try {
      const args = JSON.parse(fnArgsStr)
      const toolResult = await executeFunctionCall(fnName, args, org.id, org.currency || 'KES', storeUrl)
      if (toolResult) return toolResult
    } catch { /* parse or exec failed - fall through to cleanup */ }
  }

  // Final cleanup: strip any leftover artifacts before returning to the user
  text = cleanResponse(text)

  return text || 'Sorry, I didn\'t catch that. Type *Hi* to start again.'
}

export { classifyIntent }
export type { OrgConfig, ContactInfo }

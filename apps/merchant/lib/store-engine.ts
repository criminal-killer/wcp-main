import { db } from '@/lib/db'
import { organizations, stores, contacts, conversations, products, orders, messages } from '@/lib/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { sendTextMessage, sendInteractiveButtonMessage, sendInteractiveListMessage, sendInteractiveCTAUrlMessage } from '@/lib/whatsapp'
import { getFlowState, setFlowState, deleteFlowState, getCart, setCart, clearCart, setCartAbandoned, clearCartAbandoned as clearCartAbandonedState } from '@/lib/redis'
import { decrypt } from '@/lib/encryption'

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

interface CartItem {
  product_id: string
  product_name: string
  price: number
  qty: number
  variant?: string
}

interface FlowState {
  step: string
  store_id?: string
  category?: string
  sub_category?: string
  product_id?: string
  product_type?: string
  delivery?: string
  base_price?: number
  variant?: string
  variant_price?: number
  [key: string]: string | number | undefined
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
    ''
  )
}

export async function processIncomingMessage(ctx: EngineContext) {
  const { org, store, contact, conversation, message, accessToken } = ctx
  const waConfigObj = waConfig(org, accessToken, store)
  const phone = contact.phone
  const orgId = org.id
  const convId = conversation.id
  const inputRaw = parseInput(message).trim()
  const inputNorm = inputRaw.toLowerCase()
  const storeId = store?.id

  const flow = await getFlowState(orgId, phone) as FlowState | null

  // === ALWAYS-CHECKED COMMANDS (run even without flow state) ===
  if (['cancel', 'stop', 'exit'].includes(inputNorm)) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: '   Session ended. Type *Hi* to start again.',
    })
  }

  // === PAY LINK HANDLER (always check — survives flow reset) ===
  if (inputRaw.startsWith('pay_link_')) {
    const orderId = inputRaw.replace('pay_link_', '')
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.org_id, orgId)),
    })
    if (order && order.payment_link) {
      return await sendTextMessage(waConfigObj, {
        to: phone,
        body: `Click to pay: ${order.payment_link}`,
      })
    }
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: 'Payment link not found. Type *menu* to start again.',
    })
  }

  // === PAYMENT CONFIRMATION DETECTION (always check) ===
  const paymentKeywords = ['paid', 'done', 'sent', 'completed', 'paid already', 'already paid', 'mpesa sent', 'transaction done', 'payment done', 'i have paid', 'paid via']
  const isPaymentConfirmation = paymentKeywords.some(kw => inputNorm.includes(kw))

  if (isPaymentConfirmation) {
    // Look for order number in the message (e.g., ORD-XXXXX)
    const orderMatch = inputRaw.match(/ORD-[A-Z0-9]+/i)
    let targetOrder = null

    if (orderMatch) {
      // User specified an order number — find it
      const pendingOrders = await db.select().from(orders)
        .where(and(
          eq(orders.org_id, orgId),
          eq(orders.contact_id, contact.id),
          eq(orders.payment_status, 'pending')
        ))
      targetOrder = pendingOrders.find(o => o.order_number?.toUpperCase() === orderMatch[0].toUpperCase())
      if (!targetOrder) {
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: `Could not find a pending order with number *${orderMatch[0]}*. Please check the order number and try again.`,
        })
      }
    } else {
      // No order number — find the single pending order, or ask for clarification
      const pendingOrders = await db.select().from(orders)
        .where(and(
          eq(orders.org_id, orgId),
          eq(orders.contact_id, contact.id),
          eq(orders.payment_status, 'pending')
        ))
        .orderBy(orders.created_at)

      if (pendingOrders.length === 0) {
        // No pending orders — don't confirm anything
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: 'You have no pending orders. Type *menu* to browse products.',
        })
      } else if (pendingOrders.length === 1) {
        targetOrder = pendingOrders[0]
      } else {
        // Multiple pending orders — ask which one
        const orderList = pendingOrders.map(o => `• *${o.order_number}* — ${org.currency} ${Number(o.total).toLocaleString()}`).join('\n')
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: `You have multiple pending orders:\n${orderList}\n\nPlease reply with the order number, e.g., *paid ${pendingOrders[0].order_number}*`,
        })
      }
    }

    if (targetOrder) {
      await db.update(orders).set({
        payment_status: 'paid',
        order_status: 'confirmed',
        payment_reference: `manual_${Date.now()}`,
        updated_at: new Date().toISOString()
      }).where(eq(orders.id, targetOrder.id))

      await clearCartAbandonedState(orgId, phone)

      return await sendTextMessage(waConfigObj, {
        to: phone,
        body: `  Payment Confirmed!\n\nYour order *${targetOrder.order_number}* has been marked as paid.\n\nWe'll process it right away! Thank you for shopping with *${org.name}*   `,
      })
    }
  }

  // === FRESH START — clears cart ===
  if (['hi', 'hello', 'hey', 'start'].includes(inputNorm)) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await showGreeting(waConfigObj, org, store, phone, orgId)
  }

  // === NAVIGATION — preserves cart ===
  if (['menu', '0', '00'].includes(inputNorm)) {
    await deleteFlowState(orgId, phone)
    return await showMainMenu(waConfigObj, org, store, phone, orgId)
  }

  if (inputNorm === 'continue' || inputNorm === 'continue_to_menu') {
    return await showMainMenu(waConfigObj, org, store, phone, orgId)
  }

  if (['cart', 'view cart', '#cart'].includes(inputNorm)) {
    return await showCart(waConfigObj, org, store, phone, orgId)
  }

  if (!flow) {
    return await showGreeting(waConfigObj, org, store, phone, orgId)
  }

  // === FLOW-BASED NAVIGATION ===
  const step = flow?.step || 'main_menu'

  switch (step) {
    case 'greeting':
      return await showGreeting(waConfigObj, org, store, phone, orgId)

    case 'main_menu':
      if (inputNorm === 'browse') {
        return await showCategories(waConfigObj, org, store, phone, orgId)
      } else if (inputNorm === 'view_cart') {
        return await showCart(waConfigObj, org, store, phone, orgId)
      } else if (inputNorm === 'orders') {
        return await showOrders(waConfigObj, org, phone, orgId, contact.id)
      } else if (inputNorm === 'main_menu') {
        return await showMainMenu(waConfigObj, org, store, phone, orgId)
      }
      return await handleAiFallback(waConfigObj, org, phone, inputRaw)

    case 'browsing_categories':
      return await handleCategorySelected(waConfigObj, org, store, phone, orgId, inputRaw)

    case 'browsing_products':
      return await handleProductSelected(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    case 'product_detail':
      // Handle text-based fallback when interactive buttons fail
      if (inputNorm === '1' || inputNorm === 'add') {
        return await handleProductAction(waConfigObj, org, store, phone, orgId, `add_${flow.product_id}`, flow)
      }
      if (inputNorm === '0' || inputNorm === 'back') {
        return await showCategories(waConfigObj, org, store, phone, orgId)
      }
      return await handleProductAction(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    case 'variant_select':
      return await handleVariantSelected(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    case 'cart_review':
      return await handleCartAction(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    case 'delivery_info':
      return await handleDeliveryInfo(waConfigObj, org, store, phone, orgId, convId, inputRaw, flow, contact)

    case 'payment_select':
      return await handlePaymentSelected(waConfigObj, org, store, phone, orgId, convId, inputRaw, flow, contact)

    case 'browsing_subcategories':
      return await handleSubCategorySelected(waConfigObj, org, store, phone, orgId, inputRaw)

    case 'quantity_select':
      return await handleQuantitySelected(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    case 'edit_quantity':
      return await handleEditQuantity(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    default:
      // Try AI Fallback if not a recognized command
      return await handleAiFallback(waConfigObj, org, phone, inputRaw)
  }
}

async function handleAiFallback(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, input: string) {
  try {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    let context = `You are a helpful WhatsApp store assistant for "${org.name}". Currency: ${org.currency || 'KES'}. Be concise (1-3 sentences). If the question is unrelated to shopping, gently redirect to browsing products.`
    if (org.ai_system_prompt) context += '\n' + org.ai_system_prompt

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: context }, { role: 'user', content: input }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
    })
    const reply = completion.choices[0]?.message?.content || ''
    return await sendTextMessage(waConfig, {
      to: phone,
      body: reply || 'Sorry, I didn\'t catch that. Type *Hi* for the menu.',
    })
  } catch (err) {
    console.error('[ai-fallback]', err)
    return await sendTextMessage(waConfig, {
      to: phone,
      body: 'Sorry, I didn\'t catch that. Type *Hi* for the menu.',
    })
  }
}

async function showGreeting(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = days[new Date().getDay()]

  let greeting = ''
  if (org.ai_system_prompt && org.ai_system_prompt.trim()) {
    const lines = org.ai_system_prompt.trim().split('\n')
    greeting = lines[0].trim()
    if (!greeting.endsWith('?') && !greeting.endsWith('!') && !greeting.endsWith('.')) {
      greeting += '?'
    }
  } else {
    greeting = `Hey there! Hope your *${dayName}* is going wonderfully well!`
  }

  await setFlowState(orgId, phone, { step: 'greeting', store_id: store?.id })

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: org.name,
    body: greeting,
    footer: `Today: ${dayName}`,
    buttons: [
      { id: 'continue', title: 'Start Shopping' },
    ],
  })
}

async function showMainMenu(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string) {
  const storeCondition = store ? and(eq(products.org_id, orgId), eq(products.store_id, store.id), eq(products.is_active, 1)) : and(eq(products.org_id, orgId), eq(products.is_active, 1))
  const productList = await db.select().from(products).where(storeCondition)
  await setFlowState(orgId, phone, { step: 'main_menu', store_id: store?.id })

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: `${org.name} Store`,
    body: `Welcome to *${org.name}*!\n\nWe have *${productList.length}* products ready for you.`,
    footer: 'What would you like to do?',
    buttons: [
      { id: 'browse', title: 'Browse Products' },
      { id: 'view_cart', title: 'View Cart' },
      { id: 'orders', title: 'My Orders' },
    ],
  })
}

async function showCategories(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string) {
  const storeCondition = store ? and(eq(products.org_id, orgId), eq(products.store_id, store.id), eq(products.is_active, 1)) : and(eq(products.org_id, orgId), eq(products.is_active, 1))
  const productList = await db.select({ category: products.category })
    .from(products)
    .where(storeCondition)

  const cats = Array.from(new Set(productList.map(p => p.category).filter(Boolean))) as string[]

  if (cats.length === 0) {
    return await sendTextMessage(waConfig, { to: phone, body: '   No products available yet. Check back soon!' })
  }

  await setFlowState(orgId, phone, { step: 'browsing_categories' })

  const rows = [
    { id: 'back_menu', title: 'Back to Main Menu', description: 'Return to main menu' },
    ...cats.slice(0, 9).map(cat => ({
      id: `cat_${cat?.replace(/\s+/g, '_')}`,
      title: cat || 'General',
      description: `Browse ${cat} products`,
    }))
  ]

  return await sendInteractiveListMessage(waConfig, {
    to: phone,
    header: 'Shop by Category',
    body: `We have ${cats.length} categories for you. Choose one to browse.`,
    footer: 'Tap a category to explore',
    buttonText: 'View Categories',
    sections: [{ title: 'Categories', rows }],
  })
}

async function handleCategorySelected(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string, input: string) {
  const inputNorm = input.toLowerCase()
  
  if (inputNorm === 'back_menu' || inputNorm === 'menu') {
    return await showMainMenu(waConfig, org, store, phone, orgId)
  }

  let category: string | undefined

  if (input.startsWith('cat_')) {
    category = input.replace('cat_', '').replace(/_/g, ' ')
  } else {
    const storeCondition = store ? and(eq(products.org_id, orgId), eq(products.store_id, store.id), eq(products.is_active, 1)) : and(eq(products.org_id, orgId), eq(products.is_active, 1))
    const productList = await db.select({ category: products.category }).from(products).where(storeCondition)
    const cats = Array.from(new Set(productList.map(p => p.category).filter(Boolean))) as string[]
    const matched = cats.find(c => c.toLowerCase() === inputNorm)
    if (matched) {
      category = matched
    }
  }

  if (!category) {
    await sendTextMessage(waConfig, { to: phone, body: 'Please tap a category or type *menu*' })
    return await showCategories(waConfig, org, store, phone, orgId)
  }

  const storeCondition = store ? and(eq(products.org_id, orgId), eq(products.store_id, store.id), eq(products.is_active, 1), category ? eq(products.category, category) : undefined) : and(eq(products.org_id, orgId), eq(products.is_active, 1), category ? eq(products.category, category) : undefined)
  const productList = await db.select()
    .from(products)
    .where(storeCondition)
    .limit(20)

  if (productList.length === 0) {
    return await sendTextMessage(waConfig, { to: phone, body: '   No products in this category right now.' })
  }

  const subCats = Array.from(new Set(productList.map(p => p.sub_category).filter(Boolean))) as string[]
  
  if (subCats.length > 0) {
    await setFlowState(orgId, phone, { step: 'browsing_subcategories', category, store_id: store?.id })
    const rows = [
      { id: `sub_all_${category.replace(/\s+/g, '_')}`, title: `All ${category}`, description: 'View all products' },
      ...subCats.slice(0, 9).map(sc => ({
        id: `sub_${sc.replace(/\s+/g, '_')}`,
        title: sc,
        description: `Browse ${sc}`,
      }))
    ]
    return await sendInteractiveListMessage(waConfig, {
      to: phone,
      header: `${category} Sub-categories`,
      body: 'Select a sub-category:',
      footer: `${subCats.length} sub-categories`,
      buttonText: 'View Sub-categories',
      sections: [{ title: category, rows }],
    })
  }

  await setFlowState(orgId, phone, { step: 'browsing_products', category, store_id: store?.id })

  const rows = productList.map(p => ({
    id: `prod_${p.id}`,
    title: p.name.slice(0, 24),
    description: `${org.currency} ${(p.price ?? 0).toLocaleString()}${p.inventory_count === 0 ? ' (Out of Stock)' : ''}`,
  }))

  return await sendInteractiveListMessage(waConfig, {
    to: phone,
    header: `   ${category || 'Products'}`,
    body: 'Select a product to view details:',
    footer: `${productList.length} products`,
    buttonText: 'View Products',
    sections: [{ title: category || 'Products', rows }],
  })
}

async function handleSubCategorySelected(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string, input: string) {
  const flow = await getFlowState(orgId, phone) as FlowState | null
  const category = flow?.category

  if (!category) {
    return await showCategories(waConfig, org, store, phone, orgId)
  }

  let subCategory: string | undefined

  if (input.startsWith('sub_')) {
    const subRaw = input.replace('sub_', '').replace(/_/g, ' ')
    if (subRaw.startsWith('all ')) {
      subCategory = undefined
    } else {
      subCategory = subRaw
    }
  }

  const storeCondition = store 
    ? and(eq(products.org_id, orgId), eq(products.store_id, store.id), eq(products.is_active, 1), eq(products.category, category), subCategory ? eq(products.sub_category, subCategory) : undefined)
    : and(eq(products.org_id, orgId), eq(products.is_active, 1), eq(products.category, category), subCategory ? eq(products.sub_category, subCategory) : undefined)

  const productList = await db.select()
    .from(products)
    .where(storeCondition)
    .limit(10)

  if (productList.length === 0) {
    return await sendTextMessage(waConfig, { to: phone, body: '   No products in this sub-category right now.' })
  }

  await setFlowState(orgId, phone, { step: 'browsing_products', category, sub_category: subCategory, store_id: store?.id })

  const rows = productList.map(p => ({
    id: `prod_${p.id}`,
    title: p.name.slice(0, 24),
    description: `${org.currency} ${(p.price ?? 0).toLocaleString()}${p.inventory_count === 0 ? ' (Out of Stock)' : ''}`,
  }))

  return await sendInteractiveListMessage(waConfig, {
    to: phone,
    header: `   ${subCategory || category}`,
    body: 'Select a product to view details:',
    footer: `${productList.length} products`,
    buttonText: 'View Products',
    sections: [{ title: subCategory || category, rows }],
  })
}

async function handleProductSelected(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (!input.startsWith('prod_')) {
    return await showMainMenu(waConfig, org, store, phone, orgId)
  }

  const productId = input.replace('prod_', '')
  const storeCondition = store ? and(eq(products.id, productId), eq(products.org_id, orgId), eq(products.store_id, store.id)) : and(eq(products.id, productId), eq(products.org_id, orgId))
  const product = await db.query.products.findFirst({
    where: storeCondition,
  })

  if (!product) return await sendTextMessage(waConfig, { to: phone, body: '  Product not found.' })

  let images: string[] = []
  let variants: Array<{ type: string; options: Array<{ name: string; price?: number }> }> = []
  try {
    images = JSON.parse(product.images || '[]')
    variants = JSON.parse(product.variants || '[]')
  } catch (_) { /* malformed JSON — use empty arrays */ }

  const stockText = product.inventory_count === 0
    ? '*Out of Stock*'
    : `${product.inventory_count} in stock`

  const price = (product.price ?? 0).toLocaleString()
  const compareText = product.compare_at_price
    ? `*${org.currency} ${price}* ~(was ${org.currency} ${(product.compare_at_price ?? 0).toLocaleString()})~`
    : `*${org.currency} ${price}*`

  const description = product.description ? `\n${product.description}` : ''
  const subCategoryText = product.sub_category
    ? `${product.category} > ${product.sub_category}`
    : product.category
  const variantText = variants.length > 0
    ? `\n\n*Options:* ${variants.map(v => `${v.type}: ${v.options.map(o => o.name).join(', ')}`).join(' | ')}`
    : ''

  const productType = product.product_type || 'physical'
  const typeHint = productType === 'digital'
    ? '\n\n*Delivery:* Instant after payment'
    : productType === 'services'
    ? '\n\n*Service:* We will contact to schedule'
    : ''

  // Truncate body to WhatsApp's 1024 char limit for interactive messages
  const bodyMax = 900 // leave room for stockText + formatting
  const truncatedDesc = description.length > bodyMax ? description.slice(0, bodyMax) + '...' : description
  const bodyText = `*${product.name}*\n${compareText}\n${subCategoryText}${truncatedDesc}${variantText}${typeHint}\n\n${stockText}`

  await setFlowState(orgId, phone, { step: 'product_detail', product_id: productId, category: flow.category, product_type: productType })

  if (product.inventory_count === 0 && productType !== 'digital') {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: `${bodyText}\n\nType *menu* to go back.`,
    })
  }

  const imageUrl = images[0] && typeof images[0] === 'string' && images[0].startsWith('http') ? images[0] : undefined

  // Always try interactive first, then text fallback — guarantee a response
  try {
    const result = await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      imageUrl,
      body: bodyText,
      buttons: [
        { id: `add_${productId}`, title: 'Add to Cart' },
        { id: 'back_category', title: 'Back to Categories' },
      ],
    })
    if (result?.error) {
      // WhatsApp rejected the interactive message — send text fallback
      return await sendTextMessage(waConfig, {
        to: phone,
        body: `${bodyText}\n\nReply:\n*1* — Add to Cart\n*0* — Back to Menu`,
      })
    }
    return result
  } catch (err) {
    console.error('[handleProductSelected] send failed:', err)
    // Final fallback — text message with numbered options
    return await sendTextMessage(waConfig, {
      to: phone,
      body: `${bodyText}\n\nReply:\n*1* — Add to Cart\n*0* — Back to Menu`,
    })
  }
}

async function handleProductAction(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (input === 'back_category') {
    return await handleCategorySelected(waConfig, org, store, phone, orgId, `cat_${(flow.category || '').replace(/\s+/g, '_')}`)
  }

  if (input.startsWith('add_')) {
    const productId = flow.product_id || input.replace('add_', '')
    const storeCondition = store ? and(eq(products.id, productId), eq(products.org_id, orgId), eq(products.store_id, store.id)) : and(eq(products.id, productId), eq(products.org_id, orgId))
    const product = await db.query.products.findFirst({
      where: storeCondition,
    })
    if (!product) return await sendTextMessage(waConfig, { to: phone, body: '  Product not found.' })

    // Block out-of-stock for non-digital products
    if (product.inventory_count === 0 && product.product_type !== 'digital') {
      return await sendTextMessage(waConfig, { to: phone, body: `*${product.name}* is currently out of stock.\n\nType *menu* to browse other products.` })
    }

    const variants = JSON.parse(product.variants || '[]') as Array<{ type: string; options: Array<{ name: string; price?: number }> }>
    if (variants.length > 0) {
      await setFlowState(orgId, phone, { ...flow, step: 'variant_select', product_id: productId, base_price: product.price })
      const rows = variants[0].options.map(opt => {
        const price = opt.price ?? product.price
        const priceText = opt.price ? ` — ${org.currency} ${(opt.price ?? 0).toLocaleString()}` : ` — ${org.currency} ${(price ?? 0).toLocaleString()}`
        return {
          id: `var_${opt.name.replace(/\s+/g, '_')}`,
          title: `${opt.name}${priceText}`,
          description: `Choose this option`,
        }
      })
      return await sendInteractiveListMessage(waConfig, {
        to: phone,
        header: `${product.name} — Select ${variants[0].type}`,
        body: `Choose your ${variants[0].type}:`,
        footer: 'Tap to select',
        buttonText: 'Select Option',
        sections: [{ title: variants[0].type, rows }],
      })
    }

    await setFlowState(orgId, phone, { ...flow, step: 'quantity_select', product_id: productId, variant: undefined, variant_price: product.price })
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      body: `How many *${product.name}*?\n\n*${org.currency} ${(product.price ?? 0).toLocaleString()}* each`,
      buttons: [
        { id: 'qty_1', title: '1' },
        { id: 'qty_2', title: '2' },
        { id: 'qty_3', title: '3' },
      ],
    })
  }

  return await showMainMenu(waConfig, org, store, phone, orgId)
}

async function handleVariantSelected(
  waConfig: { phoneNumberId: string; accessToken: string },
  org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string, input: string, flow: FlowState
) {
  const variantName = input.startsWith('var_') ? input.replace('var_', '').replace(/_/g, ' ') : input
  const productId = flow.product_id
  if (!productId) return await showMainMenu(waConfig, org, store, phone, orgId)

  const storeCondition = store ? and(eq(products.id, productId), eq(products.org_id, orgId), eq(products.store_id, store.id)) : and(eq(products.id, productId), eq(products.org_id, orgId))
  const product = await db.query.products.findFirst({
    where: storeCondition,
  })
  if (!product) return await sendTextMessage(waConfig, { to: phone, body: 'Product not found.' })

  const variants = JSON.parse(product.variants || '[]') as Array<{ type: string; options: Array<{ name: string; price?: number }> }>
  let variantPrice = product.price
  
  if (variants.length > 0) {
    const matchedOpt = variants[0].options.find(o => o.name.toLowerCase() === variantName.toLowerCase())
    if (matchedOpt?.price) {
      variantPrice = matchedOpt.price
    }
  }

  await setFlowState(orgId, phone, { 
    ...flow, 
    step: 'quantity_select', 
    variant: variantName, 
    variant_price: variantPrice 
  })

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: `Add: ${variantName}`,
    body: `How many *${product.name} (${variantName})*?\n\n*${org.currency} ${variantPrice.toLocaleString()}* each`,
    buttons: [
      { id: 'qty_1', title: '1' },
      { id: 'qty_2', title: '2' },
      { id: 'qty_3', title: '3' },
    ],
  })
}

async function handleQuantitySelected(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  const productId = flow.product_id
  if (!productId) return await showMainMenu(waConfig, org, store, phone, orgId)

  const storeCondition = store ? and(eq(products.id, productId), eq(products.org_id, orgId), eq(products.store_id, store.id)) : and(eq(products.id, productId), eq(products.org_id, orgId))
  const product = await db.query.products.findFirst({
    where: storeCondition,
  })
  if (!product) return await sendTextMessage(waConfig, { to: phone, body: '  Product not found.' })

  let qty = 1
  if (input.startsWith('qty_')) {
    qty = parseInt(input.replace('qty_', '')) || 1
  } else {
    qty = parseInt(input) || 1
  }

  const price = flow.variant_price ?? product.price
  const variantText = flow.variant ? ` (${flow.variant})` : ''

  await addToCart(orgId, phone, {
    product_id: productId,
    product_name: `${product.name}${variantText}`,
    price,
    qty,
    variant: flow.variant,
  })

  await setFlowState(orgId, phone, { step: 'cart_review' })
  return await showCart(waConfig, org, store, phone, orgId)
}

async function showOrders(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string, contactId: string) {
  await setFlowState(orgId, phone, { step: 'main_menu' })

  const recentOrders = await db.query.orders.findMany({
    where: and(eq(orders.org_id, orgId), eq(orders.contact_id, contactId)),
    orderBy: (orders, { desc }) => [desc(orders.created_at)],
    limit: 5,
  })

  if (!recentOrders || recentOrders.length === 0) {
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      header: '  My Orders',
      body: 'You don\'t have any orders yet.\n\nStart shopping to place your first order!',
      buttons: [{ id: 'browse', title: 'Browse Products' }],
    })
  }

  const statusEmoji: Record<string, string> = {
    new: '  ', confirmed: '✅', processing: '  ', shipped: '  ', delivered: '  ', cancelled: '❌', refunded: '  ',
  }

  const orderLines = recentOrders.map((o, i) => {
    const emoji = statusEmoji[o.order_status] || '  '
    return `${i + 1}. *${o.order_number}* — ${emoji} ${o.order_status}\n   Total: ${o.currency || 'KES'} ${o.total} · ${o.payment_status}`
  }).join('\n\n')

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: '  My Orders',
    body: `Here are your recent orders:\n\n${orderLines}`,
    buttons: [{ id: 'browse', title: 'New Order' }, { id: 'main_menu', title: 'Main Menu' }],
  })
}

async function showCart(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string, orgId: string) {
  const cart = await getCart(orgId, phone) as CartItem[] | null
  await setFlowState(orgId, phone, { step: 'cart_review' })

  if (!cart || cart.length === 0) {
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      header: 'Your Cart',
      body: 'Your cart is empty.\n\nBrowse products and add items to get started.',
      buttons: [
        { id: 'browse', title: 'Browse Products' },
        { id: 'menu', title: 'Go to Menu' },
      ],
    })
  }

  const subtotal = cart.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0)
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  const orderLines = cart.map((i, idx) => `*${idx + 1}.* ${i.product_name} x${i.qty} = ${org.currency} ${((i.price ?? 0) * i.qty).toLocaleString()}`).join('\n')

  const editRows = cart.length <= 10 ? cart.map((i, idx) => ({
    id: `edit_item_${idx}`,
    title: `${idx + 1}. ${i.product_name}`,
    description: `${i.qty} x ${org.currency} ${(i.price ?? 0).toLocaleString()}`,
  })) : []

  if (editRows.length > 0) {
    return await sendInteractiveListMessage(waConfig, {
      to: phone,
      header: `   Cart (${itemCount} items)`,
      body: `${orderLines}\n\n*Total: ${org.currency} ${subtotal.toLocaleString()}*`,
      footer: 'Tap item to edit or remove',
      buttonText: 'Manage Cart',
      sections: [
        {
          title: 'Actions',
          rows: [
            { id: 'checkout', title: 'Checkout', description: 'Place your order' },
            { id: 'browse', title: 'Add More', description: 'Keep shopping' },
            { id: 'clear_cart', title: 'Clear Cart', description: 'Remove all items' },
          ]
        },
        { title: 'Items', rows: editRows }
      ],
    })
  }

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: `   Cart (${itemCount} items)`,
    body: `${orderLines}\n\n*Total: ${org.currency} ${subtotal.toLocaleString()}*`,
    footer: 'Ready to checkout?',
    buttons: [
      { id: 'checkout', title: 'Checkout' },
      { id: 'browse', title: 'Add More' },
      { id: 'clear_cart', title: 'Clear Cart' },
    ],
  })
}

async function handleCartAction(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  const inputNorm = input.toLowerCase()
  if (inputNorm === 'clear_cart') {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await sendTextMessage(waConfig, { to: phone, body: '    Cart cleared. Type *Hi* to start again.' })
  }
  if (inputNorm === 'browse') {
    return await showCategories(waConfig, org, store, phone, orgId)
  }
  if (inputNorm === 'checkout') {
    await setFlowState(orgId, phone, { step: 'delivery_info' })
    return await sendTextMessage(waConfig, {
      to: phone,
      body: '   *Delivery Details*\n\nPlease send your delivery address:\n\n_(e.g. "123 Main Street, Nairobi")_',
    })
  }
  if (input.startsWith('edit_item_')) {
    const idx = parseInt(input.replace('edit_item_', ''))
    const cart = await getCart(orgId, phone) as CartItem[] | null
    if (!cart || !cart[idx]) return await showCart(waConfig, org, store, phone, orgId)
    const item = cart[idx]
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      header: item.product_name,
      body: `What would you like to do with *${item.product_name}*?\n\nQty: ${item.qty}\nPrice: ${org.currency} ${(item.price ?? 0).toLocaleString()} each`,
      buttons: [
        { id: `update_qty_${idx}`, title: 'Change Qty' },
        { id: `remove_item_${idx}`, title: 'Remove' },
        { id: 'cart', title: 'Back to Cart' },
      ],
    })
  }
  if (input.startsWith('update_qty_')) {
    const idx = parseInt(input.replace('update_qty_', ''))
    await setFlowState(orgId, phone, { ...flow, step: 'edit_quantity', edit_idx: idx })
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      body: 'Choose new quantity:',
      buttons: [
        { id: 'eqty_1', title: '1' },
        { id: 'eqty_2', title: '2' },
        { id: 'eqty_3', title: '3' },
      ],
    })
  }
  if (input.startsWith('remove_item_')) {
    const idx = parseInt(input.replace('remove_item_', ''))
    const cart = await getCart(orgId, phone) as CartItem[] | null
    if (cart && cart[idx]) {
      cart.splice(idx, 1)
      await setCart(orgId, phone, cart)
      if (cart.length === 0) {
        await deleteFlowState(orgId, phone)
        return await sendTextMessage(waConfig, { to: phone, body: '  Item removed. Your cart is now empty. Type *Hi* to start again.' })
      }
    }
    return await showCart(waConfig, org, store, phone, orgId)
  }
  return await showCart(waConfig, org, store, phone, orgId)
}

async function handleDeliveryInfo(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, convId: string, input: string, flow: FlowState, contact: RunnerContact
) {
  const inputNorm = input.toLowerCase()

  // Allow escape from delivery_info
  if (['back', 'menu', 'cart', 'cancel'].includes(inputNorm)) {
    if (inputNorm === 'cancel') {
      await clearCart(orgId, phone)
      await deleteFlowState(orgId, phone)
      return await sendTextMessage(waConfig, { to: phone, body: '   Session ended. Type *Hi* to start again.' })
    }
    if (inputNorm === 'cart') return await showCart(waConfig, org, store, phone, orgId)
    return await showMainMenu(waConfig, org, store, phone, orgId)
  }

  const address = input.trim()
  if (address.length < 3) {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: 'Please enter a valid delivery address (at least 3 characters).\n\nType *back* to go back.',
    })
  }
  await setFlowState(orgId, phone, { ...flow, step: 'payment_select', delivery: address })

  const paymentOptions = []
  
  // DEFAULT: Managed Payment (MoR) or Direct Paystack
  if (org.payment_mode === 'managed' || org.store_paystack_key_encrypted) {
    paymentOptions.push({ id: 'pay_paystack', title: 'M-Pesa / Card' })
  }
  
  if (org.store_paypal_email) paymentOptions.push({ id: 'pay_paypal', title: 'PayPal' })
  if (org.store_cod_enabled) paymentOptions.push({ id: 'pay_cod', title: 'Cash on Delivery' })

  if (paymentOptions.length === 0) {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: '   The store owner has not set up payment methods yet. Please contact the store directly.',
    })
  }

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: '   Payment Method',
    body: `Delivering to: *${address}*\n\nChoose how you'd like to pay:`,
    footer: 'Secure checkout',
    buttons: paymentOptions.slice(0, 3).map(p => ({ id: p.id, title: p.title })),
  })
}

async function handleEditQuantity(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  const idx = typeof flow.edit_idx === 'number' ? flow.edit_idx : parseInt(String(flow.edit_idx) || '0')
  const cart = await getCart(orgId, phone) as CartItem[] | null
  if (!cart || !cart[idx]) return await showCart(waConfig, org, store, phone, orgId)

  let qty = 1
  if (input.startsWith('eqty_')) {
    qty = parseInt(input.replace('eqty_', '')) || 1
  } else if (input.startsWith('qty_')) {
    qty = parseInt(input.replace('qty_', '')) || 1
  } else {
    qty = parseInt(input) || 1
  }

  cart[idx].qty = qty
  await setCart(orgId, phone, cart)
  return await showCart(waConfig, org, store, phone, orgId)
}

async function handlePaymentSelected(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, convId: string, input: string, flow: FlowState, contact: RunnerContact
) {
  const inputNorm = input.toLowerCase()
  const cart = await getCart(orgId, phone) as CartItem[] | null
  if (!cart || cart.length === 0) {
    return await showMainMenu(waConfig, org, store, phone, orgId)
  }

  // Only accept known payment options — reject any other text
  const validPaymentInputs = ['pay_paystack', 'pay_paypal', 'pay_cod']
  if (!validPaymentInputs.includes(inputNorm)) {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: 'Please choose a payment method from the options above.\n\nType *menu* to go back to shopping.',
    })
  }

  const subtotal = cart.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0)
  const deliveryFee = org.delivery_fee || 0
  const total = subtotal + deliveryFee

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
  let paymentMethod = 'cod'
  let paymentStatus: 'pending' | 'paid' = 'pending'
  let paymentLink: string | undefined

  if (inputNorm === 'pay_paystack') {
    paymentMethod = 'paystack'
    // Generate Paystack payment link
    try {
      const { createStorePaymentLink } = await import('@/lib/payments')
      // Decrypt merchant key if available, otherwise use null (triggers Chatevo-Managed MoR)
      const secretKey = org.store_paystack_key_encrypted ? decrypt(org.store_paystack_key_encrypted) : null
      
      paymentLink = await createStorePaymentLink(secretKey, {
        email: contact.email || `${phone.replace(/\D/g, '')}@whatsapp.customer`,
        amount: total,
        currency: org.currency || 'KES',
        reference: orderNumber,
        metadata: { order_number: orderNumber, org_id: orgId, contact_phone: phone },
      })
    } catch (err) {
      console.error('Paystack payment link error:', err)
      return await sendTextMessage(waConfig, {
        to: phone,
        body: '  Payment link generation failed. Please try again or choose a different payment method.\n\nType *cart* to go back to your cart.',
      })
    }
  } else if (inputNorm === 'pay_paypal' && org.store_paypal_email) {
    paymentMethod = 'paypal'
    if (org.store_paypal_username) {
      paymentLink = `https://www.paypal.me/${org.store_paypal_username}/${total}`
    } else {
      paymentLink = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(org.store_paypal_email)}&amount=${total}&currency=USD`
    }
  } else if (inputNorm === 'pay_cod') {
    paymentMethod = 'cod'
    paymentStatus = 'pending'
  }

  // Create order
  const [order] = await db.insert(orders).values({
    org_id: orgId,
    contact_id: contact.id,
    order_number: orderNumber,
    items: JSON.stringify(cart),
    subtotal,
    delivery_fee: deliveryFee,
    total,
    currency: org.currency || 'KES',
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    payment_link: paymentLink || null,
    order_status: 'new',
    delivery_address: flow.delivery,
  }).returning()

  // Update contact stats
  await db.update(contacts).set({
    total_orders: (contact.total_orders || 0) + 1,
    total_spent: (contact.total_spent || 0) + total,
  }).where(and(eq(contacts.id, contact.id), eq(contacts.org_id, orgId)))

  // Decrement inventory for non-digital products
  for (const item of cart) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, item.product_id), eq(products.org_id, orgId))
    })
    if (product && product.product_type !== 'digital') {
      await db.update(products)
        .set({ inventory_count: sql`MAX(0, ${products.inventory_count} - ${item.qty})` })
        .where(and(eq(products.id, item.product_id), eq(products.org_id, orgId)))
    }
  }

  // Track for abandoned cart reminders (only for pending payment orders)
  if (paymentStatus === 'pending') {
    await setCartAbandoned(orgId, phone, order.id)
  }

  // Clear cart & flow
  await clearCart(orgId, phone)
  await deleteFlowState(orgId, phone)

  // Send confirmation with direct payment button
  if (paymentLink) {
    try {
      const result = await sendInteractiveCTAUrlMessage(waConfig, {
        to: phone,
        header: 'Order Placed!',
        body: `Order *${orderNumber}*\nTotal: *${org.currency} ${total.toLocaleString()}*\n\nTap below to pay:`,
        footer: `Reserved for 30 minutes`,
        url: paymentLink,
        buttonText: 'Pay Now',
      })
      if (!result?.error) return result
    } catch (_) { /* fallback to text */ }
    return await sendTextMessage(waConfig, {
      to: phone,
      body: `  Order *${orderNumber}* — *${org.currency} ${total.toLocaleString()}*\n\nPay here: ${paymentLink}\n\nAfter payment type *paid* to confirm.`,
    })
  }

  return await sendTextMessage(waConfig, {
    to: phone,
    body: `  *Order Confirmed!*\n\nOrder: *${orderNumber}*\nTotal: *${org.currency} ${total.toLocaleString()}*\nPayment: Cash on Delivery\n\nWe'll contact you to arrange delivery. Thank you for shopping with *${org.name}*!   `,
  })
}

async function addToCart(orgId: string, phone: string, item: CartItem) {
  const current = (await getCart(orgId, phone) || []) as CartItem[]
  const existingIdx = current.findIndex(i => i.product_id === item.product_id && i.variant === item.variant)
  if (existingIdx >= 0) {
    current[existingIdx].qty += item.qty
  } else {
    current.push(item)
  }
  await setCart(orgId, phone, current)
}


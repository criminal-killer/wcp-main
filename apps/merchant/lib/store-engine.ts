import { db } from '@/lib/db'
import { organizations, stores, contacts, conversations, products, orders, messages } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sendTextMessage, sendInteractiveButtonMessage, sendInteractiveListMessage, sendImageMessage, sendInteractiveCTAUrlMessage } from '@/lib/whatsapp'
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
    const pendingOrder = await db.select().from(orders)
      .where(and(
        eq(orders.org_id, orgId),
        eq(orders.contact_id, contact.id),
        eq(orders.payment_status, 'pending')
      ))
      .orderBy(orders.created_at)
      .limit(1)

    if (pendingOrder.length > 0) {
      await db.update(orders).set({
        payment_status: 'paid',
        order_status: 'confirmed',
        payment_reference: `manual_${Date.now()}`,
        updated_at: new Date().toISOString()
      }).where(eq(orders.id, pendingOrder[0].id))

      await clearCartAbandonedState(orgId, phone)

      return await sendTextMessage(waConfigObj, {
        to: phone,
        body: `  Payment Confirmed!\n\nYour order *${pendingOrder[0].order_number}* has been marked as paid.\n\nWe'll process it right away! Thank you for shopping with *${org.name}*   `,
      })
    }
  }

  // === FLOW RESET ===
  if (['hi', 'hello', 'hey', 'start', 'menu', '0', '00'].includes(inputNorm)) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await showGreeting(waConfigObj, org, store, phone, orgId)
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
      if (inputNorm === 'continue') {
        return await showMainMenu(waConfigObj, org, store, phone, orgId)
      }
      return await showGreeting(waConfigObj, org, store, phone, orgId)

    case 'main_menu':
      if (inputNorm === 'browse') {
        return await showCategories(waConfigObj, org, store, phone, orgId)
      } else if (inputNorm === 'view_cart') {
        return await showCart(waConfigObj, org, store, phone, orgId)
      } else if (inputNorm === 'orders') {
        return await sendTextMessage(waConfigObj, {
          to: phone,
          body: 'You do not have any active orders right now.'
        })
      }
      return await handleAiFallback(waConfigObj, org, phone, inputRaw)

    case 'browsing_categories':
      return await handleCategorySelected(waConfigObj, org, store, phone, orgId, inputRaw)

    case 'browsing_products':
      return await handleProductSelected(waConfigObj, org, store, phone, orgId, inputRaw, flow)

    case 'product_detail':
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, org_id: org.id })
    })
    const data = await response.json()
    return await sendTextMessage(waConfig, { to: phone, body: data.reply || 'Sorry, I didn\'t catch that. Type *Hi* for the menu.' })
  } catch (err) {
    return await showMainMenu(waConfig, org, null, phone, org.id)
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
    description: `${org.currency} ${p.price.toLocaleString()}${p.inventory_count === 0 ? ' (Out of Stock)' : ''}`,
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
    description: `${org.currency} ${p.price.toLocaleString()}${p.inventory_count === 0 ? ' (Out of Stock)' : ''}`,
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

  const images = JSON.parse(product.images || '[]') as string[]
  const variants = JSON.parse(product.variants || '[]') as Array<{ type: string; options: Array<{ name: string; price?: number }> }>

  const stockText = product.inventory_count === 0
    ? '*Out of Stock*'
    : `${product.inventory_count} in stock`

  const compareText = product.compare_at_price
    ? `*${org.currency} ${product.price.toLocaleString()}* ~(was ${org.currency} ${product.compare_at_price.toLocaleString()})~`
    : `*${org.currency} ${product.price.toLocaleString()}*`

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

  await setFlowState(orgId, phone, { step: 'product_detail', product_id: productId, category: flow.category, product_type: productType })

  if (product.inventory_count === 0 && productType !== 'digital') {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: `*${product.name}*\n\n${compareText}\n${subCategoryText}${description}${variantText}${typeHint}\n\n${stockText}\n\nType *menu* to go back.`,
    })
  }

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    imageUrl: images[0] || undefined,
    body: `*${product.name}*\n${compareText}\n${subCategoryText}${description}${variantText}${typeHint}\n\n${stockText}`,
    buttons: [
      { id: `add_${productId}`, title: 'Add to Cart' },
      { id: 'back_category', title: 'Back to Categories' },
    ],
  })
}

async function handleProductAction(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, store: RunnerStore | null, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (input === 'back_category' || input === '  back') {
    return await handleCategorySelected(waConfig, org, store, phone, orgId, `cat_${(flow.category || '').replace(/\s+/g, '_')}`)
  }

  if (input.startsWith('add_')) {
    const productId = flow.product_id || input.replace('add_', '')
    const storeCondition = store ? and(eq(products.id, productId), eq(products.org_id, orgId), eq(products.store_id, store.id)) : and(eq(products.id, productId), eq(products.org_id, orgId))
    const product = await db.query.products.findFirst({
      where: storeCondition,
    })
    if (!product) return await sendTextMessage(waConfig, { to: phone, body: '  Product not found.' })

    const variants = JSON.parse(product.variants || '[]') as Array<{ type: string; options: Array<{ name: string; price?: number }> }>
    if (variants.length > 0) {
      await setFlowState(orgId, phone, { ...flow, step: 'variant_select', product_id: productId, base_price: product.price })
      const rows = variants[0].options.map(opt => {
        const price = opt.price ?? product.price
        const priceText = opt.price ? ` — ${org.currency} ${opt.price.toLocaleString()}` : ` — ${org.currency} ${price.toLocaleString()}`
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
      body: `How many *${product.name}*?\n\n*${org.currency} ${product.price.toLocaleString()}* each`,
      buttons: [
        { id: 'qty_1', title: '1' },
        { id: 'qty_2', title: '2' },
        { id: 'qty_3', title: '3' },
        { id: 'qty_5', title: '5' },
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
      { id: 'qty_5', title: '5' },
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

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  const orderLines = cart.map((i, idx) => `*${idx + 1}.* ${i.product_name} x${i.qty} = ${org.currency} ${(i.price * i.qty).toLocaleString()}`).join('\n')

  const editRows = cart.length <= 10 ? cart.map((i, idx) => ({
    id: `edit_item_${idx}`,
    title: `${idx + 1}. ${i.product_name}`,
    description: `${i.qty} x ${org.currency} ${i.price.toLocaleString()}`,
  })) : []

  await setFlowState(orgId, phone, { step: 'cart_review' })

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
      body: `What would you like to do with *${item.product_name}*?\n\nQty: ${item.qty}\nPrice: ${org.currency} ${item.price.toLocaleString()} each`,
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
        { id: 'eqty_5', title: '5' },
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
  const address = input
  await setFlowState(orgId, phone, { ...flow, step: 'payment_select', delivery: address })

  const paymentOptions = []
  
  // DEFAULT: Managed Payment (MoR) or Direct Paystack
  if (org.payment_mode === 'managed' || org.store_paystack_key_encrypted || !org.store_paystack_key_encrypted) {
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

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
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
    }
  } else if (inputNorm === 'pay_paypal' && org.store_paypal_email) {
    paymentMethod = 'paypal'
    paymentLink = `https://www.paypal.me/${org.store_paypal_email.split('@')[0]}/${total}`
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


import { db } from '@/lib/db'
import { organizations, contacts, conversations, products, orders, messages } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sendTextMessage, sendInteractiveButtonMessage, sendInteractiveListMessage, sendImageMessage } from '@/lib/whatsapp'
import { getFlowState, setFlowState, deleteFlowState, getCart, setCart, clearCart } from '@/lib/redis'
import { decrypt } from '@/lib/encryption'

type RunnerOrg = typeof organizations.$inferSelect
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
  category?: string
  product_id?: string
  delivery?: string
  [key: string]: string | number | undefined
}

const waConfig = (org: RunnerOrg, accessToken: string) => ({
  phoneNumberId: org.wa_phone_number_id!,
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
  const { org, contact, conversation, message, accessToken } = ctx
  const waConfigObj = waConfig(org, accessToken)
  const phone = contact.phone
  const orgId = org.id
  const convId = conversation.id
  const input = parseInput(message).toLowerCase().trim()

  const flow = await getFlowState(orgId, phone) as FlowState | null

  // === GLOBAL COMMANDS ===
  if (['hi', 'hello', 'hey', 'start', 'menu', '0', '00'].includes(input) || !flow) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await showMainMenu(waConfigObj, org, phone, orgId)
  }

  if (['cart', 'view cart', '#cart'].includes(input)) {
    return await showCart(waConfigObj, org, phone, orgId)
  }

  if (['cancel', 'stop', 'exit'].includes(input)) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: '👋 Session ended. Type *Hi* to start again.',
    })
  }

  // === FLOW-BASED NAVIGATION ===
  const step = flow?.step || 'main_menu'

  switch (step) {
    case 'browsing_categories':
      return await handleCategorySelected(waConfigObj, org, phone, orgId, input)

    case 'browsing_products':
      return await handleProductSelected(waConfigObj, org, phone, orgId, input, flow)

    case 'product_detail':
      return await handleProductAction(waConfigObj, org, phone, orgId, input, flow)

    case 'variant_select':
      return await handleVariantSelected(waConfigObj, org, phone, orgId, input, flow)

    case 'cart_review':
      return await handleCartAction(waConfigObj, org, phone, orgId, input, flow)

    case 'delivery_info':
      return await handleDeliveryInfo(waConfigObj, org, phone, orgId, convId, input, flow, contact)

    case 'payment_select':
      return await handlePaymentSelected(waConfigObj, org, phone, orgId, convId, input, flow, contact)

    default:
      // Try AI Fallback if not a recognized command
      return await handleAiFallback(waConfigObj, org, phone, input)
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
    return await showMainMenu(waConfig, org, phone, org.id)
  }
}

async function showMainMenu(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string) {
  const productCount = await db.select().from(products).where(and(eq(products.org_id, orgId), eq(products.is_active, 1)))
  await setFlowState(orgId, phone, { step: 'main_menu' })

  // --- Human-Like Professional Concierge Greeting ---
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = days[new Date().getDay()]
  
  // Suggestive / High-End tone (Standard for all, custom for Growth soon)
  const greeting = `Hey there! 😊 Hope your *${dayName}* is going wonderfully well!\n\nI'm your personal shopping assistant here at *${org.name}*. We have *${productCount.length}* specially selected items waiting for you today.\n\nHow can I help you find exactly what you're looking for?`

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: org.name,
    body: greeting,
    footer: 'Powered by Chatevo',
    buttons: [
      { id: 'browse', title: '🛍️ Browse Products' },
      { id: 'view_cart', title: '🛒 View Cart' },
      { id: 'orders', title: '📦 My Orders' },
    ],
  })
}

async function showCategories(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string) {
  const productList = await db.select({ category: products.category })
    .from(products)
    .where(and(eq(products.org_id, orgId), eq(products.is_active, 1)))

  const cats = Array.from(new Set(productList.map(p => p.category).filter(Boolean))) as string[]

  if (cats.length === 0) {
    return await sendTextMessage(waConfig, { to: phone, body: '😔 No products available yet. Check back soon!' })
  }

  await setFlowState(orgId, phone, { step: 'browsing_categories' })

  const rows = cats.slice(0, 10).map(cat => ({
    id: `cat_${cat?.replace(/\s+/g, '_')}`,
    title: cat || 'General',
    description: `Browse ${cat} products`,
  }))

  return await sendInteractiveListMessage(waConfig, {
    to: phone,
    header: '🛍️ Categories',
    body: 'Select a category to browse products:',
    footer: `${cats.length} categories available`,
    buttonText: 'View Categories',
    sections: [{ title: 'All Categories', rows }],
  })
}

async function handleCategorySelected(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string, input: string) {
  let category: string | undefined

  if (input.startsWith('cat_')) {
    category = input.replace('cat_', '').replace(/_/g, ' ')
  } else if (input === 'browse' || input === '🛍️ browse products') {
    return await showCategories(waConfig, org, phone, orgId)
  } else {
    return await showCategories(waConfig, org, phone, orgId)
  }

  const productList = await db.select()
    .from(products)
    .where(and(
      eq(products.org_id, orgId),
      eq(products.is_active, 1),
      category ? eq(products.category, category) : undefined,
    ))
    .limit(10)

  if (productList.length === 0) {
    return await sendTextMessage(waConfig, { to: phone, body: '😔 No products in this category right now.' })
  }

  await setFlowState(orgId, phone, { step: 'browsing_products', category })

  const rows = productList.map(p => ({
    id: `prod_${p.id}`,
    title: p.name.slice(0, 24),
    description: `${org.currency} ${p.price.toLocaleString()}${p.inventory_count === 0 ? ' (Out of Stock)' : ''}`,
  }))

  return await sendInteractiveListMessage(waConfig, {
    to: phone,
    header: `📦 ${category || 'Products'}`,
    body: 'Select a product to view details:',
    footer: `${productList.length} products`,
    buttonText: 'View Products',
    sections: [{ title: category || 'Products', rows }],
  })
}

async function handleProductSelected(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (!input.startsWith('prod_')) {
    return await showMainMenu(waConfig, org, phone, orgId)
  }

  const productId = input.replace('prod_', '')
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.org_id, orgId)),
  })

  if (!product) return await sendTextMessage(waConfig, { to: phone, body: '❌ Product not found.' })

  const images = JSON.parse(product.images || '[]') as string[]
  const variants = JSON.parse(product.variants || '[]') as Array<{ type: string; options: string[] }>

  // Send product image first
  if (images[0]) {
    await sendImageMessage(waConfig, { to: phone, imageUrl: images[0], caption: product.name })
  }

  const stockText = product.inventory_count === 0
    ? '❌ *Out of Stock*'
    : `✅ In Stock (${product.inventory_count} left)`

  const compareText = product.compare_at_price
    ? `\n~${org.currency} ${product.compare_at_price.toLocaleString()}~ → *${org.currency} ${product.price.toLocaleString()}*`
    : `\n*${org.currency} ${product.price.toLocaleString()}*`

  const description = product.description ? `\n\n${product.description}` : ''
  const variantText = variants.length > 0
    ? `\n\n📋 Options: ${variants.map(v => `${v.type}: ${v.options.join(', ')}`).join(' | ')}`
    : ''

  await setFlowState(orgId, phone, { step: 'product_detail', product_id: productId, category: flow.category })

  if (product.inventory_count === 0) {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: `*${product.name}*${compareText}${description}${variantText}\n\n${stockText}\n\nType *menu* to go back.`,
    })
  }

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    body: `*${product.name}*${compareText}${description}${variantText}\n\n${stockText}`,
    buttons: [
      { id: `add_${productId}`, title: '🛒 Add to Cart' },
      { id: 'back_category', title: '← Back' },
    ],
  })
}

async function handleProductAction(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (input === 'back_category' || input === '← back') {
    return await handleCategorySelected(waConfig, org, phone, orgId, `cat_${(flow.category || '').replace(/\s+/g, '_')}`)
  }

  if (input.startsWith('add_')) {
    const productId = flow.product_id || input.replace('add_', '')
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.org_id, orgId)),
    })
    if (!product) return await sendTextMessage(waConfig, { to: phone, body: '❌ Product not found.' })

    const variants = JSON.parse(product.variants || '[]') as Array<{ type: string; options: string[] }>
    if (variants.length > 0) {
      // Ask for variant selection
      await setFlowState(orgId, phone, { ...flow, step: 'variant_select', product_id: productId })
      const rows = variants[0].options.map(opt => ({
        id: `var_${opt.replace(/\s+/g, '_')}`,
        title: opt,
        description: `Select ${variants[0].type}: ${opt}`,
      }))
      return await sendInteractiveListMessage(waConfig, {
        to: phone,
        header: `Select ${variants[0].type}`,
        body: `Choose your *${variants[0].type}* for *${product.name}*:`,
        footer: product.name,
        buttonText: `Pick ${variants[0].type}`,
        sections: [{ title: variants[0].type, rows }],
      })
    }

    // No variants — add directly
    await addToCart(orgId, phone, { product_id: productId, product_name: product.name, price: product.price, qty: 1 })
    await setFlowState(orgId, phone, { step: 'cart_review' })
    return await showCart(waConfig, org, phone, orgId)
  }

  return await showMainMenu(waConfig, org, phone, orgId)
}

async function handleVariantSelected(
  waConfig: { phoneNameId: string; accessToken: string } | { phoneNumberId: string; accessToken: string },
  org: RunnerOrg, phone: string, orgId: string, input: string, flow: FlowState
) {
  const variant = input.startsWith('var_') ? input.replace('var_', '').replace(/_/g, ' ') : input
  const productId = flow.product_id
  if (!productId) return await showMainMenu(waConfig as { phoneNumberId: string; accessToken: string }, org, phone, orgId)

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.org_id, orgId)),
  })
  if (!product) return await sendTextMessage(waConfig as { phoneNumberId: string; accessToken: string }, { to: phone, body: '❌ Product not found.' })

  await addToCart(orgId, phone, {
    product_id: productId,
    product_name: `${product.name} (${variant})`,
    price: product.price,
    qty: 1,
    variant,
  })

  await setFlowState(orgId, phone, { step: 'cart_review' })
  return await showCart(waConfig as { phoneNumberId: string; accessToken: string }, org, phone, orgId)
}

async function showCart(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string) {
  const cart = await getCart(orgId, phone) as CartItem[] | null
  await setFlowState(orgId, phone, { step: 'cart_review' })

  if (!cart || cart.length === 0) {
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      body: '🛒 Your cart is empty!\n\nBrowse our products to start shopping.',
      buttons: [
        { id: 'browse', title: '🛍️ Browse Products' },
        { id: 'menu', title: '🏠 Main Menu' },
      ],
    })
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const orderLines = cart.map((i, idx) => `${idx + 1}. *${i.product_name}* ×${i.qty} = ${org.currency} ${(i.price * i.qty).toLocaleString()}`).join('\n')

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: '🛒 Your Cart',
    body: `${orderLines}\n\n*Total: ${org.currency} ${subtotal.toLocaleString()}*`,
    footer: 'Review your order',
    buttons: [
      { id: 'checkout', title: '✅ Checkout' },
      { id: 'browse', title: '+ Add More' },
      { id: 'clear_cart', title: '🗑️ Clear Cart' },
    ],
  })
}

async function handleCartAction(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (input === 'clear_cart') {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await sendTextMessage(waConfig, { to: phone, body: '🗑️ Cart cleared. Type *Hi* to start again.' })
  }
  if (input === 'browse') {
    return await showCategories(waConfig, org, phone, orgId)
  }
  if (input === 'checkout') {
    await setFlowState(orgId, phone, { step: 'delivery_info' })
    return await sendTextMessage(waConfig, {
      to: phone,
      body: '📦 *Delivery Details*\n\nPlease send your delivery address:\n\n_(e.g. "123 Main Street, Nairobi")_',
    })
  }
  return await showCart(waConfig, org, phone, orgId)
}

async function handleDeliveryInfo(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, convId: string, input: string, flow: FlowState, contact: RunnerContact
) {
  const address = input
  await setFlowState(orgId, phone, { ...flow, step: 'payment_select', delivery: address })

  const paymentOptions = []
  
  // DEFAULT: Managed Payment (MoR) or Direct Paystack
  if (org.payment_mode === 'managed' || org.store_paystack_key_encrypted || !org.store_paystack_key_encrypted) {
    paymentOptions.push({ id: 'pay_paystack', title: '💳 M-Pesa / Card' })
  }
  
  if (org.store_paypal_email) paymentOptions.push({ id: 'pay_paypal', title: '💵 PayPal' })
  if (org.store_cod_enabled) paymentOptions.push({ id: 'pay_cod', title: '💰 Cash on Delivery' })

  if (paymentOptions.length === 0) {
    return await sendTextMessage(waConfig, {
      to: phone,
      body: '⚠️ The store owner has not set up payment methods yet. Please contact the store directly.',
    })
  }

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: '💳 Payment Method',
    body: `Delivering to: *${address}*\n\nChoose how you'd like to pay:`,
    footer: 'Secure checkout',
    buttons: paymentOptions.slice(0, 3).map(p => ({ id: p.id, title: p.title })),
  })
}

async function handlePaymentSelected(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, convId: string, input: string, flow: FlowState, contact: RunnerContact
) {
  const cart = await getCart(orgId, phone) as CartItem[] | null
  if (!cart || cart.length === 0) {
    return await showMainMenu(waConfig, org, phone, orgId)
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFee = org.delivery_fee || 0
  const total = subtotal + deliveryFee

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
  let paymentMethod = 'cod'
  let paymentStatus: 'pending' | 'paid' = 'pending'
  let paymentLink: string | undefined

  if (input === 'pay_paystack') {
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
  } else if (input === 'pay_paypal' && org.store_paypal_email) {
    paymentMethod = 'paypal'
    paymentLink = `https://www.paypal.me/${org.store_paypal_email.split('@')[0]}/${total}`
  } else if (input === 'pay_cod') {
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
    order_status: 'new',
    delivery_address: flow.delivery,
  }).returning()

  // Update contact stats
  await db.update(contacts).set({
    total_orders: (contact.total_orders || 0) + 1,
    total_spent: (contact.total_spent || 0) + total,
  }).where(and(eq(contacts.id, contact.id), eq(contacts.org_id, orgId)))

  // Clear cart & flow
  await clearCart(orgId, phone)
  await deleteFlowState(orgId, phone)

  // Send confirmation
  if (paymentLink) {
    return await sendInteractiveButtonMessage(waConfig, {
      to: phone,
      header: '✅ Order Placed!',
      body: `*Order ${orderNumber}*\nTotal: *${org.currency} ${total.toLocaleString()}*\n\nClick below to complete your payment:`,
      footer: 'Your order is reserved for 30 minutes',
      buttons: [{ id: `pay_link_${order.id}`, title: '💳 Pay Now' }],
    })
  }

  return await sendTextMessage(waConfig, {
    to: phone,
    body: `✅ *Order Confirmed!*\n\nOrder: *${orderNumber}*\nTotal: *${org.currency} ${total.toLocaleString()}*\nPayment: Cash on Delivery\n\nWe'll contact you to arrange delivery. Thank you for shopping with *${org.name}*! 🎉`,
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


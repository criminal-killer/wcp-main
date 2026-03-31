import { db } from '@/lib/db'
import { organizations, contacts, conversations, products, orders, messages } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
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

  // === GLOBAL RESET COMMANDS (always reset to main menu) ===
  if (['hi', 'hello', 'hey', 'start', 'menu', '0', '00', 'home'].includes(input)) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await showMainMenu(waConfigObj, org, phone, orgId)
  }

  if (['cancel', 'stop', 'exit'].includes(input)) {
    await clearCart(orgId, phone)
    await deleteFlowState(orgId, phone)
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: '👋 Session ended. Type *Hi* to start again.',
    })
  }

  // === DIRECT BUTTON ACTIONS (from main menu — always route correctly) ===
  // These must be handled BEFORE the flow switch to avoid looping back to greeting
  if (input === 'browse' || input === '🛍️ browse shop' || input === 'browse shop') {
    return await showCategories(waConfigObj, org, phone, orgId)
  }

  if (input === 'search' || input === '🔍 search / ai' || input === 'search / ai') {
    await setFlowState(orgId, phone, { step: 'searching' })
    const e = (emoji: string) => org.bot_emojis_enabled ? emoji : ''
    return await sendTextMessage(waConfigObj, {
      to: phone,
      body: `${e('🔍')} *AI Personal Shopper*\n\nTell me what you're looking for!\n\nYou can search by name, or be specific like:\n- _"Red shoes under ${org.currency} 5000"_\n- _"Blue shirts in size M"_\n- _"What do you have for ${org.currency} 2000?"_`,
    })
  }

  if (input === 'view_cart' || input === '🛒 view cart' || input === 'view cart' || input === 'cart' || input === '#cart') {
    return await showCart(waConfigObj, org, phone, orgId)
  }

  // === NO FLOW STATE: user is lost, send them home ===
  if (!flow) {
    return await showMainMenu(waConfigObj, org, phone, orgId)
  }

  // === FLOW-BASED NAVIGATION ===
  const step = flow?.step || 'main_menu'

  switch (step) {
    case 'main_menu':
      // If we get here with main_menu step and no recognized button, show categories
      return await showCategories(waConfigObj, org, phone, orgId)

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

    case 'delivery_zone_select':
      return await handleZoneSelected(waConfigObj, org, phone, orgId, input, flow)

    case 'delivery_info':
      return await handleDeliveryInfo(waConfigObj, org, phone, orgId, convId, input, flow, contact)

    case 'payment_select':
      return await handlePaymentSelected(waConfigObj, org, phone, orgId, convId, input, flow, contact)

    case 'manual_payment_verify':
      return await handleManualPaymentVerification(waConfigObj, org, phone, orgId, input, flow)

    case 'searching':
      return await handleProductSearch(waConfigObj, org, phone, orgId, input)

    default:
      // Unknown step — send to AI fallback
      return await handleAiFallback(waConfigObj, org, phone, input)
  }
}

async function handleAiFallback(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, input: string) {
  // 1. Check & Enforce Limits (Growth/Elite have unlimited, Starter has 20/day, 350/month)
  const isStarter = org.plan === 'starter' || !org.plan;
  
  if (isStarter) {
    const now = new Date();
    const lastDaily = org.usage_last_reset_daily ? new Date(org.usage_last_reset_daily) : new Date(0);
    const lastMonthly = org.usage_last_reset_monthly ? new Date(org.usage_last_reset_monthly) : new Date(0);
    
    // Auto-reset daily
    const isNewDay = now.toDateString() !== lastDaily.toDateString();
    const isNewMonth = now.getMonth() !== lastMonthly.getMonth() || now.getFullYear() !== lastMonthly.getFullYear();

    let dailyCount = isNewDay ? 0 : (org.usage_ai_daily_count || 0);
    let monthlyCount = isNewMonth ? 0 : (org.usage_ai_monthly_count || 0);
    
    if (dailyCount >= 20 || monthlyCount >= 350) {
      return await sendTextMessage(waConfig, { 
        to: phone, 
        body: `⚠️ *AI limit reached for today.*\n\nThe store owner is currently on a *Starter Plan*. To enable unlimited AI searches, please ask them to upgrade to *Growth* or *Elite*! 🚀` 
      });
    }

    // Increment usage
    await db.update(organizations).set({
      usage_ai_daily_count: dailyCount + 1,
      usage_ai_monthly_count: monthlyCount + 1,
      usage_last_reset_daily: now.toISOString(),
      ...(isNewMonth ? { usage_last_reset_monthly: now.toISOString() } : {})
    }).where(eq(organizations.id, org.id));
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, org_id: org.id })
    })
    const data = await response.json()
    
    // If AI identifies a search intent, it should redirect to handleProductSearch
    if (data.action === 'search') {
      return await handleProductSearch(waConfig, org, phone, org.id, data.query || input);
    }

    return await sendTextMessage(waConfig, { to: phone, body: data.reply || 'Sorry, I didn\'t catch that. Type *Hi* for the menu.' })
  } catch (err) {
    return await showMainMenu(waConfig, org, phone, org.id)
  }
}

async function handleProductSearch(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string, input: string) {
  const e = (emoji: string) => org.bot_emojis_enabled ? emoji : '';

  // If no actual search query yet, prompt for it
  if (!input || input.length < 2) {
    return await showCategories(waConfig, org, phone, orgId)
  }

  // Basic keyword search logic
  const allProducts = await db.select().from(products).where(and(eq(products.org_id, orgId), eq(products.is_active, 1)));
  
  // Match keywords against name, description, category
  const keywords = input.toLowerCase().split(' ').filter(k => k.length > 1);
  const results = allProducts.filter(p => {
    const name = p.name.toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    return keywords.some(k => name.includes(k) || desc.includes(k) || cat.includes(k));
  }).slice(0, 10);

  if (results.length === 0) {
    return await sendTextMessage(waConfig, { 
      to: phone, 
      body: `${e('😔')} I couldn't find products matching *"${input}"*.\n\nTry a different keyword, or type *menu* to browse categories.` 
    });
  }

  await setFlowState(orgId, phone, { step: 'browsing_products', search_query: input });

  const rows = results.map(p => ({
    id: `prod_${p.id}`,
    title: p.name.slice(0, 24),
    description: `${org.currency} ${p.price.toLocaleString()}${p.inventory_count === 0 ? ' (Out of Stock)' : ''}`,
  }));

  return await sendInteractiveListMessage(waConfig, {
    to: phone,
    header: `${e('✅')} Search Results`,
    body: `Found *${results.length}* item(s) matching your request:`,
    footer: `Searching for: "${input}"`,
    buttonText: 'View Items',
    sections: [{ title: 'Results', rows }],
  });
}

async function showMainMenu(waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string, orgId: string) {
  const productCount = await db.select().from(products).where(and(eq(products.org_id, orgId), eq(products.is_active, 1)))
  await setFlowState(orgId, phone, { step: 'main_menu' })

  // Emojis helper
  const e = (emoji: string) => org.bot_emojis_enabled ? emoji : '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = days[new Date().getDay()]
  
  // Derive style from org settings, default to 'default'
  const style: string = (org as any).bot_greeting_style || 'default';

  // Premium 3-Bubble Flow - Send preceding messages first
  if (style !== 'minimal') {
    // Message 1: Greeting
    const greetingPart1 = style === 'street' ? `Yo! ${e('👟')}` :
                         style === 'corporate' ? `Welcome to the official *${org.name}* WhatsApp channel.` :
                         style === 'friendly' ? `Hi there! ${e('👋')} Happy *${dayName}* from all of us at *${org.name}*!` :
                         `Good day! ${e('😊')} I hope your *${dayName}* is going wonderfully well.`;
    
    await sendTextMessage(waConfig, { to: phone, body: greetingPart1 });
    
    // Message 2: Identity
    const greetingPart2 = style === 'street' ? `Checkin' out *${org.name}* on this fine *${dayName}*?` :
                         style === 'corporate' ? `Today is *${dayName}*. Our current inventory features *${productCount.length}* active listings.` :
                         style === 'friendly' ? `We're so excited to have you here! ${e('✨')}` :
                         `I'm your personal shopping assistant at *${org.name}*.`;
    
    await sendTextMessage(waConfig, { to: phone, body: greetingPart2 });
  }

  // Message 3 (Final bubble with buttons): Call to Action
  const finalCta = style === 'street' ? `We got *${productCount.length}* fresh drops waitin'. What you lookin' for? ${e('🔥')}` :
                   style === 'minimal' ? `Welcome to *${org.name}*.\n\n*${productCount.length}* items available.\nHow can we help?` :
                   style === 'corporate' ? `Please select an option below to proceed.` :
                   style === 'friendly' ? `We've got *${productCount.length}* amazing things for you to see today.\n\nTell me, what can I help you find? ${e('😊')}` :
                   `We have *${productCount.length}* specially selected items waiting for you.\n\nHow can I help you find exactly what you're looking for?`;

  const buttons = [];
  if (org.bot_show_search) buttons.push({ id: 'search', title: `${e('🔍 ')}Search / AI` });
  if (org.bot_show_categories) buttons.push({ id: 'browse', title: `${e('🛍️ ')}Browse Shop` });
  if (org.bot_show_cart) buttons.push({ id: 'view_cart', title: `${e('🛒 ')}View Cart` });
  
  // Ensure at least one button always exists
  if (buttons.length === 0) {
    buttons.push({ id: 'browse', title: `${e('🛍️ ')}Browse Shop` });
  }

  if (buttons.length > 3) {
    return await sendInteractiveListMessage(waConfig, {
      to: phone,
      header: org.name,
      body: finalCta,
      footer: org.bot_custom_footer || 'Powered by Sella',
      buttonText: 'Main Menu',
      sections: [{ 
        title: 'Options', 
        rows: buttons.map(b => ({ id: b.id, title: b.title.slice(0, 24) })) 
      }]
    });
  }

  return await sendInteractiveButtonMessage(waConfig, {
    to: phone,
    header: org.name,
    body: finalCta,
    footer: org.bot_custom_footer || 'Powered by Sella',
    buttons: buttons,
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
    const zones = JSON.parse(org.delivery_zones || '[]') as Array<{ name: string; fee: number }>
    
    if (zones.length > 0) {
      await setFlowState(orgId, phone, { step: 'delivery_zone_select' })
      const rows = zones.map((z, idx) => ({
        id: `zone_${idx}`,
        title: z.name,
        description: `${org.currency} ${z.fee.toLocaleString()} delivery fee`,
      }))
      return await sendInteractiveListMessage(waConfig, {
        to: phone,
        header: '📍 Select Delivery Zone',
        body: 'Where should we deliver your order?',
        footer: 'Select a zone to calculate delivery fees',
        buttonText: 'Choose Zone',
        sections: [{ title: 'Available Zones', rows }],
      })
    }

    await setFlowState(orgId, phone, { step: 'delivery_info' })
    return await sendTextMessage(waConfig, {
      to: phone,
      body: '📦 *Delivery Details*\n\nPlease send your delivery address:\n\n_(e.g. "123 Main Street, Nairobi")_',
    })
  }
  return await showCart(waConfig, org, phone, orgId)
}

async function handleZoneSelected(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  if (!input.startsWith('zone_')) return await showCart(waConfig, org, phone, orgId)
  
  const zoneIdx = parseInt(input.replace('zone_', ''))
  const zones = JSON.parse(org.delivery_zones || '[]') as Array<{ name: string; fee: number }>
  const zone = zones[zoneIdx]
  
  if (!zone) return await showCart(waConfig, org, phone, orgId)

  await setFlowState(orgId, phone, { ...flow, step: 'delivery_info', delivery_zone: zone.name, delivery_fee: zone.fee })
  
  return await sendTextMessage(waConfig, {
    to: phone,
    body: `📍 *Zone: ${zone.name}* (${org.currency} ${zone.fee.toLocaleString()} fee)\n\nNow, please send your specific delivery address or landmark:\n\n_(e.g. "House 4, Green Court")_`,
  })
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
  
  // Manual Payment (New)
  const features = JSON.parse(org.enabled_features || '{}')
  if (features.manual_payments && (org.store_mpesa_till || org.store_bank_details)) {
    paymentOptions.push({ id: 'pay_manual', title: '📲 Manual Transfer' })
  }

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
      // Decrypt merchant key if available, otherwise use null (triggers Sella-Managed MoR)
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
  } else if (input === 'pay_manual') {
    paymentMethod = 'manual'
    paymentStatus = 'pending'
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
    delivery_zone: flow.delivery_zone_name,
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

  if (paymentMethod === 'manual') {
    let manualDetails = ''
    if (org.store_mpesa_till) manualDetails += `📲 *M-Pesa Till:* ${org.store_mpesa_till}\n`
    if (org.store_bank_details) manualDetails += `🏦 *Bank:* ${org.store_bank_details}\n`

    await setFlowState(orgId, phone, { step: 'manual_payment_verify', order_id: order.id, order_number: orderNumber })

    return await sendTextMessage(waConfig, {
      to: phone,
      body: `✅ *Order ${orderNumber} Reserved!*\n\nTotal to Pay: *${org.currency} ${total.toLocaleString()}*\n\n*Payment Details:*\n${manualDetails}\n⚠️ *Action Required:* Please make the payment and then *paste the confirmation message* or send a *Screenshot* here for verification.`,
    })
  }

  return await sendTextMessage(waConfig, {
    to: phone,
    body: `✅ *Order Confirmed!*\n\nOrder: *${orderNumber}*\nTotal: *${org.currency} ${total.toLocaleString()}*\nPayment: Cash on Delivery\n\nWe'll contact you to arrange delivery. Thank you for shopping with *${org.name}*! 🎉`,
  })
}

async function handleManualPaymentVerification(
  waConfig: { phoneNumberId: string; accessToken: string }, org: RunnerOrg, phone: string,
  orgId: string, input: string, flow: FlowState
) {
  const orderId = flow.order_id as string
  const orderNumber = flow.order_number as string

  // Simple "Approval" flow - In real world, AI would parse the M-Pesa text here
  await db.update(orders).set({
    payment_status: 'pending', // Merchant still needs to manually confirm in dashboard
    payment_reference: input.slice(0, 500),
    payment_proof: input, // Dedicated field for the the full text or image URL
    notes: `Manual verification requested.`,
    updated_at: sql`(datetime('now'))`,
  }).where(eq(orders.id, orderId))

  await deleteFlowState(orgId, phone)

  return await sendTextMessage(waConfig, {
    to: phone,
    body: `🕒 *Payment Received & Pending Approval*\n\nThank you! We've received your payment proof for Order *${orderNumber}*.\n\nOur team will verify this within a few minutes. You'll receive a confirmation once approved! ${org.bot_emojis_enabled ? '✨' : ''}`,
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

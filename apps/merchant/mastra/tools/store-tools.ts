import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { db } from '@/lib/db'
import { products, orders, contacts, organizations } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export function createStoreTools(orgId: string) {
  return {
    getProducts: createTool({
      id: 'getProducts',
      description: 'Search and list products in your store. Returns product details including name, price, category, inventory count, and product type.',
      inputSchema: z.object({
        search: z.string().optional().describe('Search term to filter products by name'),
        category: z.string().optional().describe('Filter by category name'),
        limit: z.number().optional().default(20).describe('Maximum number of products to return'),
      }),
      execute: async ({ search, category, limit = 20 }) => {
        const conditions = [eq(products.org_id, orgId), eq(products.is_active, 1)]
        if (search) conditions.push(sql`${products.name} LIKE ${'%' + search + '%'}`)
        if (category) conditions.push(eq(products.category, category))

        const results = await db.select({
          id: products.id,
          name: products.name,
          price: products.price,
          category: products.category,
          sub_category: products.sub_category,
          inventory_count: products.inventory_count,
          product_type: products.product_type,
          is_active: products.is_active,
        }).from(products).where(and(...conditions)).limit(limit)

        return results
      },
    }),

    getOrders: createTool({
      id: 'getOrders',
      description: 'List orders with optional filters for status, date range, and limit.',
      inputSchema: z.object({
        status: z.string().optional().describe('Filter by order status: new, confirmed, processing, shipped, delivered, cancelled, refunded, closed'),
        paymentStatus: z.string().optional().describe('Filter by payment status: pending, pending_approval, paid, failed, refunded'),
        limit: z.number().optional().default(10).describe('Maximum number of orders to return'),
        daysBack: z.number().optional().describe('Only return orders from the last N days'),
      }),
      execute: async ({ status, paymentStatus, limit = 10, daysBack }) => {
        const conditions = [eq(orders.org_id, orgId)]
        if (status) conditions.push(eq(orders.order_status, status))
        if (paymentStatus) conditions.push(eq(orders.payment_status, paymentStatus))
        if (daysBack) conditions.push(sql`${orders.created_at} >= datetime('now', '-' || ${daysBack} || ' days')`)

        const results = await db.select({
          id: orders.id,
          order_number: orders.order_number,
          total: orders.total,
          currency: orders.currency,
          payment_status: orders.payment_status,
          order_status: orders.order_status,
          payment_method: orders.payment_method,
          created_at: orders.created_at,
        }).from(orders).where(and(...conditions)).orderBy(desc(orders.created_at)).limit(limit)

        return results
      },
    }),

    getOrder: createTool({
      id: 'getOrder',
      description: 'Get detailed information about a specific order by its ID or order number.',
      inputSchema: z.object({
        orderId: z.string().describe('The order ID or order number (e.g., ORD-XXXXX)'),
      }),
      execute: async ({ orderId }) => {
        const conditions = [eq(orders.org_id, orgId)]
        if (orderId.toUpperCase().startsWith('ORD-')) {
          conditions.push(eq(orders.order_number, orderId.toUpperCase()))
        } else {
          conditions.push(eq(orders.id, orderId))
        }

        const order = await db.query.orders.findFirst({ where: and(...conditions) })
        if (!order) return { error: 'Order not found' }

        let items: any[] = []
        try { items = JSON.parse(order.items || '[]') } catch {}

        return {
          id: order.id,
          order_number: order.order_number,
          items,
          subtotal: order.subtotal,
          delivery_fee: order.delivery_fee,
          discount: order.discount,
          total: order.total,
          currency: order.currency,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          order_status: order.order_status,
          delivery_address: order.delivery_address,
          created_at: order.created_at,
        }
      },
    }),

    getAnalytics: createTool({
      id: 'getAnalytics',
      description: 'Get store analytics including total orders, revenue, top products, and customer stats for a given period.',
      inputSchema: z.object({
        daysBack: z.number().optional().default(30).describe('Number of days to look back for analytics'),
      }),
      execute: async ({ daysBack = 30 }) => {
        const dateCondition = sql`${orders.created_at} >= datetime('now', '-' || ${daysBack} || ' days')`

        const orderStats = await db.select({
          total: sql`COUNT(*)`.as('total'),
          revenue: sql`COALESCE(SUM(${orders.total}), 0)`.as('revenue'),
        }).from(orders).where(and(eq(orders.org_id, orgId), dateCondition))

        const totalOrders = await db.select({
          total: sql`COUNT(*)`.as('total'),
        }).from(orders).where(eq(orders.org_id, orgId))

        const totalCustomers = await db.select({
          total: sql`COUNT(*)`.as('total'),
        }).from(contacts).where(eq(contacts.org_id, orgId))

        return {
          recentOrders: Number(orderStats[0]?.total || 0),
          recentRevenue: Number(orderStats[0]?.revenue || 0),
          totalOrders: Number(totalOrders[0]?.total || 0),
          totalCustomers: Number(totalCustomers[0]?.total || 0),
          periodDays: daysBack,
        }
      },
    }),

    getContacts: createTool({
      id: 'getContacts',
      description: 'Search and list customer contacts with their order history.',
      inputSchema: z.object({
        search: z.string().optional().describe('Search by customer name or phone'),
        limit: z.number().optional().default(20).describe('Maximum number of contacts to return'),
      }),
      execute: async ({ search, limit = 20 }) => {
        const conditions = [eq(contacts.org_id, orgId)]
        if (search) {
          conditions.push(sql`(${contacts.name} LIKE ${'%' + search + '%'} OR ${contacts.phone} LIKE ${'%' + search + '%'})`)
        }

        const results = await db.select({
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email,
          total_orders: contacts.total_orders,
          total_spent: contacts.total_spent,
          last_order_at: contacts.last_order_at,
          created_at: contacts.created_at,
        }).from(contacts).where(and(...conditions)).orderBy(desc(contacts.last_order_at)).limit(limit)

        return results
      },
    }),

    updateSetting: createTool({
      id: 'updateSetting',
      description: 'Update a store setting such as description, delivery fee, currency, etc. Only use this when the merchant explicitly asks to change a setting.',
      inputSchema: z.object({
        key: z.enum(['description', 'delivery_fee', 'free_delivery_above', 'currency', 'timezone', 'language']).describe('The setting key to update'),
        value: z.string().describe('The new value for the setting'),
      }),
      execute: async ({ key, value }) => {
        const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
        if (key === 'delivery_fee' || key === 'free_delivery_above') {
          updateData[key] = parseFloat(value)
        } else {
          updateData[key] = value
        }

        await db.update(organizations).set(updateData).where(eq(organizations.id, orgId))
        return { success: true, updated: key, value }
      },
    }),
  }
}

export type StoreTools = ReturnType<typeof createStoreTools>

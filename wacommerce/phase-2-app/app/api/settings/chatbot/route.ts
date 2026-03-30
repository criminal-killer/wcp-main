import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user || !user.org_id) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

  const body = await req.json() as { 
    menu_style?: string; 
    emojis_enabled?: boolean; 
    custom_footer?: string;
    show_search?: boolean;
    show_categories?: boolean;
    show_cart?: boolean;
    show_orders?: boolean;
  }
  
  const update: any = { 
    updated_at: new Date().toISOString() 
  }
  
  if (body.menu_style) update.bot_menu_style = body.menu_style
  if (body.emojis_enabled !== undefined) update.bot_emojis_enabled = body.emojis_enabled ? 1 : 0
  if (body.custom_footer !== undefined) update.bot_custom_footer = body.custom_footer
  if (body.show_search !== undefined) update.bot_show_search = body.show_search ? 1 : 0
  if (body.show_categories !== undefined) update.bot_show_categories = body.show_categories ? 1 : 0
  if (body.show_cart !== undefined) update.bot_show_cart = body.show_cart ? 1 : 0
  if (body.show_orders !== undefined) update.bot_show_orders = body.show_orders ? 1 : 0

  const [org] = await db.update(organizations)
    .set(update)
    .where(eq(organizations.id, user.org_id))
    .returning()
    
  return NextResponse.json({ data: org, message: 'Chatbot styling updated' })
}

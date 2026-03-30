import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
  if (!user || !user.org_id) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

  // Wiping credentials for WhatsApp
  await db.update(organizations)
    .set({ 
      wa_phone_number_id: '',
      wa_access_token_encrypted: '',
      wa_webhook_verified: 0,
      updated_at: new Date().toISOString() 
    })
    .where(eq(organizations.id, user.org_id))
    
  return NextResponse.json({ message: 'WhatsApp credentials revoked success' })
}

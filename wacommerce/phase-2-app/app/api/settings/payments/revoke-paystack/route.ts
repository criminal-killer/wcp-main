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

  await db.update(organizations)
    .set({ 
      store_paystack_key_encrypted: '',
      updated_at: new Date().toISOString() 
    })
    .where(eq(organizations.id, user.org_id))
    
  return NextResponse.json({ message: 'Paystack key removed success' })
}

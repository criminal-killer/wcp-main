import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { encrypt } from '@/lib/encryption'

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.org_id) })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const body = await req.json()
    const isPremium = ['pro', 'elite', 'custom'].includes(org.plan || '')
    const isStandardChatevo = body.ai_provider === 'Chatevo'

    if (!isPremium && !isStandardChatevo) {
      return NextResponse.json({ 
        error: 'Custom AI Providers are only available on Pro and Elite plans. Please upgrade to use your own keys.',
        code: 'PLAN_GATING'
      }, { status: 403 })
    }

    const update: any = {
      ai_provider: body.ai_provider,
      ai_model: body.ai_model,
      ai_persona: body.ai_persona,
      ai_endpoint_url: body.ai_endpoint_url,
      ai_system_prompt: body.ai_system_prompt,
      updated_at: new Date().toISOString()
    }

    if (body.ai_api_key) {
      update.ai_api_key_encrypted = encrypt(body.ai_api_key)
    }

    await db.update(organizations).set(update).where(eq(organizations.id, user.org_id))
    
    return NextResponse.json({ message: 'AI settings updated successfully' })
  } catch (error: any) {
    console.error('AI Settings Update Error:', error)
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 })
  }
}


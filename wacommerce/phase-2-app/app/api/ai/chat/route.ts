import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateAiReply } from '@/lib/ai-service'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { message, org_id } = body

    if (!userId && !org_id) return new NextResponse('Unauthorized', { status: 401 })

    const response = await generateAiReply(message, org_id, userId)
    
    // Return standard search action or standard text reply
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('AI Chat Route Error:', error)
    return NextResponse.json({ 
      reply: "I'm experiencing a high volume of requests. Please try again or contact support." 
    })
  }
}


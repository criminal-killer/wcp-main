import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const list = await db.select({
      id: messages.id,
      org_id: messages.org_id,
      direction: messages.direction,
      content: messages.content,
      message_type: messages.message_type,
      status: messages.status,
      created_at: messages.created_at,
    })
    .from(messages)
    .orderBy(desc(messages.created_at))
    .limit(10);

    return NextResponse.json({ success: true, messages: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

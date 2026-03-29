import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  // Export contacts as CSV - public-ish but scoped by the contacts endpoint
  const { searchParams } = new URL(req.url)
  // This is handled by the contacts route, redirect
  return NextResponse.redirect(new URL('/api/contacts', req.url))
}

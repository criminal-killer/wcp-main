import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, params.slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo_url: true,
      theme_color: true,
      currency: true,
      delivery_fee: true,
      free_delivery_above: true,
      wa_phone_number_id: true,
    },
  })

  if (!org) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  let waPhone = ''
  if (org.wa_phone_number_id) {
    waPhone = org.wa_phone_number_id.replace(/\D/g, '')
  }

  return NextResponse.json({ ...org, wa_phone: waPhone })
}

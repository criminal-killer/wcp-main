import { redirect } from 'next/navigation'

export default function ContactDetail({ params }: { params: { id: string } }) {
  // Contact detail page not yet implemented — redirect to contacts list
  redirect('/dashboard/contacts')
}

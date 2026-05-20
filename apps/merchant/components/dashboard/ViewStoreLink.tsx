'use client'

import { Globe } from 'lucide-react'

interface ViewStoreLinkProps {
  href: string
}

export default function ViewStoreLink({ href }: ViewStoreLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="p-2 text-muted-foreground hover:text-whatsapp transition-colors"
      title="View store"
      type="button"
    >
      <Globe size={18} />
    </button>
  )
}
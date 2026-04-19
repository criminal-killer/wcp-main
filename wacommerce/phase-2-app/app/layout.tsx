import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { DM_Serif_Display, Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const serif = DM_Serif_Display({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Chatevo — Sell Smarter on WhatsApp | AI-Powered Commerce',
    template: '%s | Chatevo'
  },
  description: 'Chatevo turns your WhatsApp into a fully automated AI store. Let customers browse, order, and pay without leaving chat. Built for Kenyan merchants — M-Pesa, Paybill, Bank all supported.',
  keywords: [
    'whatsapp commerce', 'whatsapp store', 'sell on whatsapp', 'kenya whatsapp shop',
    'mpesa payments', 'whatsapp catalog', 'chatevo', 'whatsapp bot shop kenya'
  ],
  authors: [{ name: 'Chatevo Team' }],
  creator: 'Chatevo',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('http') 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : `https://${process.env.NEXT_PUBLIC_APP_URL || 'chatevo-app.vercel.app'}`
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Chatevo — Sell Smarter on WhatsApp',
    description: 'Transform your WhatsApp into a high-converting AI storefront. Automate orders, accept M-Pesa, Paybill, and Bank payments, all inside chat.',
    siteName: 'Chatevo',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Chatevo — WhatsApp Commerce Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatevo — Sell Smarter on WhatsApp',
    description: 'AI-powered WhatsApp commerce for Kenyan merchants. M-Pesa, Paybill & more.',
    creator: '@chatevohq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Chatevo",
    "applicationCategory": "BusinessApplication",
    "description": "WhatsApp commerce platform for Kenyan merchants. AI-powered WhatsApp store with M-Pesa, Paybill, and Bank payments.",
    "operatingSystem": "Web, Android, iOS",
    "offers": [
      { "@type": "Offer", "price": "3500", "priceCurrency": "KES", "name": "Starter Plan" },
      { "@type": "Offer", "price": "7000", "priceCurrency": "KES", "name": "Growth Plan" },
      { "@type": "Offer", "price": "13000", "priceCurrency": "KES", "name": "Elite Plan" },
    ],
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "120" },
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://chatevo.app",
    "sameAs": ["https://instagram.com/chatevohq", "https://facebook.com/chatevohq"],
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${serif.variable} ${outfit.variable}`}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="font-outfit antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="theme-emerald"
            enableSystem={false}
            disableTransitionOnChange
            themes={['theme-emerald', 'theme-midnight', 'theme-ocean', 'theme-lavender', 'theme-rose', 'theme-amber', 'theme-slate', 'theme-coffee', 'theme-forest', 'theme-crimson']}
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

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
    default: 'SELLA — WhatsApp Commerce Platform | Sell Products Directly in Chat',
    template: '%s | SELLA'
  },
  description: 'The professional way to sell products directly inside WhatsApp chat. Let your customers browse catalogs, add to cart, and checkout without ever leaving WhatsApp. Built for speed and loved by global merchants.',
  keywords: [
    'whatsapp commerce', 'whatsapp store', 'sell on whatsapp', 'whatsapp shopping', 
    'whatsapp catalog', 'e-commerce over whatsapp', 'whatsapp checkout', 'sella app'
  ],
  authors: [{ name: 'Sella Team' }],
  creator: 'Sella',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://sella-app.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'SELLA — WhatsApp Commerce Platform',
    description: 'Transform your WhatsApp into a high-converting storefront. Automate orders, accept global payments (Paystack, Stripe, PayPal, M-Pesa), and scale effortlessly.',
    siteName: 'SELLA',
    images: [{
      url: '/og-image.jpg', // Ensure you add this image in public folder later
      width: 1200,
      height: 630,
      alt: 'SELLA WhatsApp Commerce Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SELLA — The Global WhatsApp Commerce Platform',
    description: 'Sell globally on WhatsApp. Professional e-commerce directly inside chat.',
    creator: '@sellahq',
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
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${serif.variable} ${outfit.variable}`}>
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

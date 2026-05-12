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
    default: 'Chatevo — WhatsApp Commerce Platform | Sell Products Directly in Chat',
    template: '%s | Chatevo'
  },
  description: 'Turn your WhatsApp into a powerful e-commerce store. Let customers browse products, add to cart, and checkout without leaving chat. Accept M-Pesa, cards, and bank transfers. Built for merchants globally.',
  keywords: [
    'whatsapp commerce', 'whatsapp store', 'sell on whatsapp', 'whatsapp shopping',
    'whatsapp catalog', 'whatsapp checkout', 'whatsapp business', 'ecommerce whatsapp',
    'M-Pesa payments', 'mobile money commerce', 'african ecommerce', 'conversational commerce',
    'shopify alternative', 'woocommerce alternative', 'chatevo', 'chatevo app'
  ],
  authors: [{ name: 'Chatevo Team' }],
  creator: 'Chatevo',
  publisher: 'Chatevo',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('http')
      ? process.env.NEXT_PUBLIC_APP_URL
      : `https://${process.env.NEXT_PUBLIC_APP_URL || 'chatevo-app.vercel.app'}`
  ),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Chatevo',
    title: 'Chatevo — WhatsApp Commerce Platform',
    description: 'Transform your WhatsApp into a high-converting storefront. Automate orders, accept global payments (Paystack, Stripe, PayPal, M-Pesa), and scale effortlessly.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Chatevo WhatsApp Commerce Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatevo — The Global WhatsApp Commerce Platform',
    description: 'Sell globally on WhatsApp. Professional e-commerce directly inside chat.',
    creator: '@Chatevohq',
    site: '@Chatevohq',
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
    notranslate: false,
  },
  category: 'E-commerce',
  verification: {
    google: 'google-site-verification-code',
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


import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/docs', '/affiliates/apply', '/sign-up', '/sign-in', '/store/'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/onboarding'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

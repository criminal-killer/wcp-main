import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sella-app.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/docs', '/affiliates/apply'],
      disallow: ['/dashboard/', '/admin/', '/onboarding/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.com'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/sign-up', '/sign-in', '/docs', '/affiliates/apply'],
      disallow: ['/dashboard/', '/admin/', '/onboarding/', '/api/', '/affiliates/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}


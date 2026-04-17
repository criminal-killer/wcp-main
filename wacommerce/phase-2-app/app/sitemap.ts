import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chatevo.app'
  const now = new Date()

  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/sign-up`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/sign-up/choose-plan`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/sign-in`, lastModified: now, changeFrequency: 'never', priority: 0.4 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/affiliates/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/affiliates/dashboard`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Add more blog/content pages as you grow:
    // { url: `${baseUrl}/blog/how-to-sell-on-whatsapp`, ... }
  ]
}

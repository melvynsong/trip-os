import type { MetadataRoute } from 'next'
import { branding as BRAND } from '@/lib/branding'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BRAND.canonicalUrl
  const now = new Date().toISOString()

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}

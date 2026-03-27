import type { MetadataRoute } from 'next'
import { branding as BRAND } from '@/lib/branding'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow crawling public-facing pages
        userAgent: '*',
        allow: ['/', '/login', '/dinner'],
        // Block authenticated-only areas
        disallow: ['/trips', '/app', '/api', '/owner', '/admin', '/auth'],
      },
    ],
    sitemap: `${BRAND.canonicalUrl}/sitemap.xml`,
  }
}

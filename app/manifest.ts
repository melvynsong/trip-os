import type { MetadataRoute } from 'next'
import { branding as BRAND } from '@/lib/branding'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.appName,
    short_name: BRAND.shortName,
    description: BRAND.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  }
}

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
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}

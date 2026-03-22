import type { MetadataRoute } from 'next'
import { branding } from '@/lib/branding'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: branding.appName,
    short_name: branding.shortName,
    description: branding.description,
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

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'ToGoStory'

export const branding = {
  appName,
  shortName: appName,
  domain: 'togostory.com',
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  description: 'Plan, go, share.',
} as const

export type BrandingConfig = typeof branding

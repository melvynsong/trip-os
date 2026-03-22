const appName = process.env.NEXT_PUBLIC_APP_NAME || 'ToGoStory'

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (raw && raw !== 'NEXT_PUBLIC_SITE_URL') {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      return new URL(candidate).origin
    } catch {}
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3000'
}

export const branding = {
  appName,
  shortName: appName,
  domain: 'togostory.com',
  siteUrl: resolveSiteUrl(),
  description: 'Plan, go, share.',
} as const

export type BrandingConfig = typeof branding

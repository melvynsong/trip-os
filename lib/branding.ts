let hasWarnedAboutAppName = false
let hasWarnedAboutSiteUrl = false

function warnInvalidAppName(raw: string) {
  if (hasWarnedAboutAppName) return

  hasWarnedAboutAppName = true
  console.warn(
    `[branding] Ignoring invalid NEXT_PUBLIC_APP_NAME value: ${raw}. Falling back to ToGoStory.`
  )
}

function warnInvalidSiteUrl(raw: string) {
  if (hasWarnedAboutSiteUrl) return

  hasWarnedAboutSiteUrl = true
  console.warn(
    `[branding] Ignoring invalid NEXT_PUBLIC_SITE_URL value: ${raw}. Falling back to a safe default origin.`
  )
}

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (raw && raw !== 'NEXT_PUBLIC_SITE_URL') {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      return new URL(candidate).origin
    } catch {
      warnInvalidSiteUrl(raw)
    }
  }

  if (raw === 'NEXT_PUBLIC_SITE_URL') {
    warnInvalidSiteUrl(raw)
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // In production, do not fallback to localhost. Return empty string or throw.
  return ''
}

function resolveAppName() {
  const raw = process.env.NEXT_PUBLIC_APP_NAME?.trim()

  if (raw && raw !== 'NEXT_PUBLIC_APP_NAME') {
    return raw
  }

  if (raw === 'NEXT_PUBLIC_APP_NAME') {
    warnInvalidAppName(raw)
  }

  return 'ToGoStory'
}

const appName = resolveAppName()

export const branding = {
  appName,
  shortName: appName,
  domain: 'togostory.com',
  /** Primary canonical domain — used for JSON-LD, OG, and sitemap */
  canonicalUrl: 'https://www.togostory.com',
  siteUrl: resolveSiteUrl(),
  description:
    'Plan trips you love, go with confidence, share stories that matter.',
  tagline: 'Plan · Go · Share',
  logoUrl: 'https://www.togostory.com/branding/logo.png',
} as const

export type BrandingConfig = typeof branding

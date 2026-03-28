import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AccessSection from '@/app/components/landing/AccessSection'
import AlphaSection from '@/app/components/landing/AlphaSection'
import BetaServicesSection from '@/app/components/landing/BetaServicesSection'
import FinalCtaSection from '@/app/components/landing/FinalCtaSection'
import HeroSection from '@/app/components/landing/HeroSection'
import ValueSection from '@/app/components/landing/ValueSection'
import JsonLd from '@/app/components/shared/JsonLd'
import { createClient } from '@/lib/supabase/server'
import { branding as BRAND } from '@/lib/branding'

export const metadata: Metadata = {
  title: `${BRAND.appName} — ${BRAND.tagline}`,
  description: BRAND.description,
  alternates: { canonical: BRAND.canonicalUrl },
  openGraph: {
    title: `${BRAND.appName} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: BRAND.canonicalUrl,
  },
}

type HomePageProps = {
  searchParams?: Promise<{
    code?: string
    error?: string
    error_code?: string
    error_description?: string
    state?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const code = resolvedSearchParams?.code?.trim()

  if (code) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
      if (typeof value === 'string' && value.trim()) {
        params.set(key, value)
      }
    }

    redirect(`/auth/callback?${params.toString()}`)
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/trips')
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.appName,
    alternateName: BRAND.domain,
    url: BRAND.canonicalUrl,
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.appName,
    url: BRAND.canonicalUrl,
    logo: BRAND.logoUrl,
  }

  return (
    <main className="min-h-screen">
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <HeroSection />
        <ValueSection />
        <AccessSection />
        <AlphaSection />
        <BetaServicesSection />
        <FinalCtaSection />
      </div>
    </main>
  )
}
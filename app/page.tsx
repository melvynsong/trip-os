import { redirect } from 'next/navigation'
import AccessSection from '@/app/components/landing/AccessSection'
import AlphaSection from '@/app/components/landing/AlphaSection'
import FinalCtaSection from '@/app/components/landing/FinalCtaSection'
import HeroSection from '@/app/components/landing/HeroSection'
import ValueSection from '@/app/components/landing/ValueSection'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/trips')
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <HeroSection />
        <ValueSection />
        <AccessSection />
        <AlphaSection />
        <FinalCtaSection />
      </div>
    </main>
  )
}
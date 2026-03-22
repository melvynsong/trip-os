import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BrandLine from '@/app/components/shared/BrandLine'
import LoginButton from '@/app/components/auth/LoginButton'
import { branding } from '@/lib/branding'

export default async function HomePage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/trips')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-20">
        <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">{branding.appName}</h1>
            <p className="mt-3 text-lg text-gray-600">Plan → Go → Share</p>
            <BrandLine className="mt-2 text-gray-400" />

            <div className="mt-8 space-y-3 text-gray-700">
              <p>Every trip begins with an idea.</p>
              <p>A place you want to go.</p>
              <p>A moment you want to experience.</p>
              <p>A story waiting to be told.</p>
            </div>

            <div className="mt-8 space-y-3 text-gray-700">
              <p>{branding.appName} helps you through the whole journey:</p>
              <p>• To — plan with clarity</p>
              <p>• Go — experience with support</p>
              <p>• Story — capture and share what matters</p>
            </div>

            <p className="mt-8 text-lg font-medium text-gray-900">We don’t just travel. We collect stories.</p>

            <div className="mt-8">
              <LoginButton className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold text-gray-900">Why travelers use {branding.appName}</h2>
          <ul className="mt-5 space-y-3 text-gray-700">
            <li>• Plan your itinerary in one place</li>
            <li>• Discover places and restaurants for your trip</li>
            <li>• Organise your journey more easily</li>
            <li>• Turn your trip into stories and memories you can share</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-4 px-4 pb-8 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Free Tier</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>• Sign in with Google</li>
            <li>• Create 1 trip per year</li>
            <li>• Basic recommendations for places and restaurants</li>
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Friends Access</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>• Please contact me</li>
            <li>• Create up to 3 trips per year</li>
            <li>• Google-powered search</li>
            <li>• AI assistant for planning and trip organisation</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold text-gray-900">Alpha</h2>
          <div className="mt-4 space-y-3 text-gray-700">
            <p>{branding.appName} is currently in alpha.</p>
            <p>It is already useful, but still evolving.</p>
            <p>
              Features may change and performance may vary as the product improves.
              Access is intentionally kept simple at this stage so the experience can be
              refined thoughtfully and costs can be managed responsibly.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:pb-20">
        <div className="rounded-3xl bg-gray-900 p-8 text-white shadow-sm sm:p-10">
          <p className="text-xl font-semibold sm:text-2xl">
            Your next trip isn’t just a destination.
            <br />
            It’s a story waiting to happen.
          </p>
          <div className="mt-6">
            <LoginButton
              label="Start your first story"
              className="rounded-xl bg-white px-6 py-3 font-medium text-gray-900 transition hover:bg-gray-100"
            />
          </div>
        </div>
      </section>
    </main>
  )
}
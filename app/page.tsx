import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BrandLine from '@/app/components/shared/BrandLine'
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
    <main className="min-h-screen flex items-center justify-center">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-4">{branding.appName}</h1>
        <BrandLine className="mb-3 text-gray-400" />
        <p className="text-red-600">Not logged in</p>
      </div>
    </main>
  )
}
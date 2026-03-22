'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandLine from '@/app/components/shared/BrandLine'
import { branding } from '@/lib/branding'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(
        user
          ? { email: user.email ?? '' }
          : null
      )
      setLoading(false)
    }

    checkUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:py-4">
        <Link
          href="/"
          className="rounded-lg px-2 py-1 transition hover:bg-white/10 active:scale-[0.98]"
        >
          <div className="text-2xl font-bold">{branding.appName}</div>
          <BrandLine compact className="mt-0.5 text-white/80" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`rounded-lg px-3 py-2 text-sm transition active:scale-[0.98] ${
              isActive('/') ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
            }`}
          >
            Home
          </Link>
          <Link
            href="/trips"
            className={`rounded-lg px-3 py-2 text-sm transition active:scale-[0.98] ${
              isActive('/trips') ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
            }`}
          >
            Trips
          </Link>

          {!loading && user && (
            <button
              onClick={handleLogout}
              className="min-h-10 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 active:scale-[0.98]"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold hover:opacity-80">
          Trip.OS
        </Link>

        <div className="flex gap-6 items-center">
          <Link
            href="/"
            className={`${isActive('/') ? 'font-bold underline' : ''} hover:opacity-80`}
          >
            Home
          </Link>
          <Link
            href="/trips"
            className={`${isActive('/trips') ? 'font-bold underline' : ''} hover:opacity-80`}
          >
            Trips
          </Link>

          {!loading && !user && (
            <Link
              href="/login"
              className={`${isActive('/login') ? 'font-bold underline' : ''} hover:opacity-80`}
            >
              Login
            </Link>
          )}

          {!loading && user && (
            <button
              onClick={handleLogout}
              className="hover:opacity-80 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
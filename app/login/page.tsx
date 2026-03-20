'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient()

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <button
        onClick={handleLogin}
        className="rounded-xl bg-black px-6 py-3 text-white"
      >
        Continue with Google
      </button>
    </main>
  )
}
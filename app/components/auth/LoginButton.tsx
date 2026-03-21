'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginButton() {
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
    <button
      onClick={handleLogin}
      className="rounded-xl bg-black px-6 py-3 text-white"
    >
      Continue with Google
    </button>
  )
}

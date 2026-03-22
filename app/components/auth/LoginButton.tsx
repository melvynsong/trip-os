'use client'

import { createClient } from '@/lib/supabase/client'
import { branding } from '@/lib/branding'

type LoginButtonProps = {
  label?: string
  className?: string
}

export default function LoginButton({
  label = 'Continue with Google',
  className = 'rounded-xl bg-black px-6 py-3 text-white',
}: LoginButtonProps) {
  const handleLogin = async () => {
    const supabase = createClient()
    const callbackOrigin =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? window.location.origin
        : `https://${branding.domain}`

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${callbackOrigin}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className={className}
    >
      {label}
    </button>
  )
}

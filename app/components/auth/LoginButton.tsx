'use client'

import { createClient } from '@/lib/supabase/client'
import { branding } from '@/lib/branding'

type LoginButtonProps = {
  label?: string
  className?: string
}

export default function LoginButton({
  label = 'Continue with Google',
  className = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-sky-200/70 bg-[linear-gradient(135deg,#ffffff,#f0f9ff)] px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(14,116,144,0.15)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_16px_30px_rgba(59,130,246,0.22)]',
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
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600 ring-1 ring-slate-200">
        G
      </span>
      {label}
    </button>
  )
}

'use client'

import { useState } from 'react'
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
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogin = async () => {
    if (isRedirecting) return

    setIsRedirecting(true)
    const supabase = createClient()
    const callbackOrigin =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? window.location.origin
        : `https://${branding.domain}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${callbackOrigin}/auth/callback`,
      },
    })

    if (error) {
      setIsRedirecting(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleLogin}
        className={className}
        disabled={isRedirecting}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600 ring-1 ring-slate-200">
          G
        </span>
        {isRedirecting ? 'Opening secure sign-in…' : label}
      </button>
      {isRedirecting ? (
        <p className="text-xs text-slate-500" aria-live="polite">
          Google or Apple passkey prompts are expected during secure sign-in.
        </p>
      ) : null}
    </div>
  )
}

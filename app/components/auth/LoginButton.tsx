'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type LoginButtonProps = {
  label?: string
  className?: string
}

export default function LoginButton({
  label = 'Continue with Google',
  className = 'inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-transparent bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)] transition hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-press)]',
}: LoginButtonProps) {
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const authErrorFromUrl = searchParams.get('authError')
  const visibleError = authError || authErrorFromUrl

  const handleLogin = async () => {
    if (isRedirecting) return

    setIsRedirecting(true)
    setAuthError(null)

    try {
      const supabase = createClient()
      const callbackUrl = new URL('/auth/callback', window.location.origin).toString()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      setIsRedirecting(false)
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Secure sign-in took too long. Please try again.'
      )
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleLogin}
        className={className}
        disabled={isRedirecting}
      >
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--brand-primary)] ring-1 ring-white/20">
          G
        </span>
        {isRedirecting ? 'Opening secure sign-in…' : label}
      </button>
      {isRedirecting ? (
        <p className="text-xs text-[var(--text-subtle)]" aria-live="polite">
          Google or Apple passkey prompts are expected during secure sign-in.
        </p>
      ) : null}
      {visibleError ? (
        <p className="text-xs text-red-700" aria-live="polite">
          {visibleError}
        </p>
      ) : null}
    </div>
  )
}

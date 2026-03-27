'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const providerError = searchParams.get('error')
  const providerErrorDescription = searchParams.get('error_description')
  const code = searchParams.get('code')
  const retry = searchParams.get('retry')

  const redirectError = useMemo(() => {
    return providerErrorDescription || providerError || null
  }, [providerError, providerErrorDescription])

  useEffect(() => {
    let isCancelled = false

    const completeSignIn = async () => {
      if (redirectError) {
        const encoded = encodeURIComponent(redirectError)
        router.replace(`/?authError=${encoded}`)
        return
      }

      if (!code) {
        router.replace('/?authError=Missing authorization code. Please try signing in again.')
        return
      }

      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            isSingleton: false,
            auth: {
              detectSessionInUrl: false,
            },
          }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          throw error
        }

        if (!isCancelled) {
          router.replace('/trips')
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to finish secure sign-in. Please try again.'

        const isPkceMissing = /PKCE code verifier not found/i.test(message)

        if (isPkceMissing && retry !== '1') {
          const retryCallbackUrl = new URL('/auth/callback', window.location.origin)
          retryCallbackUrl.searchParams.set('retry', '1')

          const retryClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              isSingleton: false,
              auth: {
                detectSessionInUrl: false,
              },
            }
          )

          await retryClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: retryCallbackUrl.toString(),
            },
          })

          return
        }

        if (!isCancelled) {
          setErrorMessage(message)
        }
      }
    }

    completeSignIn()

    return () => {
      isCancelled = true
    }
  }, [code, redirectError, retry, router])

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-strong)]">Finishing secure sign-in…</h1>
      <p className="mt-3 text-sm text-[var(--text-subtle)]">Please wait while we connect your account.</p>
      {errorMessage ? (
        <p className="mt-4 text-sm text-red-700" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}
    </main>
  )
}

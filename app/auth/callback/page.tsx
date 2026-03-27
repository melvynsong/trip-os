import { Suspense } from 'react'
import AuthCallbackClient from './AuthCallbackClient'

function LoadingState() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-strong)]">Finishing secure sign-in…</h1>
      <p className="mt-3 text-sm text-[var(--text-subtle)]">Please wait while we connect your account.</p>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallbackClient />
    </Suspense>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient()

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-4xl font-bold text-black">Login</h1>
        <p className="mb-8 text-center text-gray-600">
          Sign in to your Trip.OS account
        </p>

        <button
          onClick={handleLogin}
          className="w-full rounded-xl bg-blue-900 px-6 py-3 text-white hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    </main>
  )
}
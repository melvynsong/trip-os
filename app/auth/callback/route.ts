import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const providerError = requestUrl.searchParams.get('error')
  const providerErrorDescription = requestUrl.searchParams.get('error_description')

  if (providerError) {
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set(
      'authError',
      providerErrorDescription || providerError || 'Unable to complete sign-in.'
    )
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    try {
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            },
          },
        }
      )

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        throw error
      }
    } catch (error) {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set(
        'authError',
        error instanceof Error ? error.message : 'Unable to finish sign-in.'
      )
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(new URL('/trips', request.url))
}
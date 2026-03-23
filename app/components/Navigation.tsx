import Link from 'next/link'
import { redirect } from 'next/navigation'
import BrandLine from '@/app/components/shared/BrandLine'
import { buttonClass } from '@/app/components/ui/Button'
import { branding } from '@/lib/branding'
import type { MembershipTier } from '@/lib/membership/types'
import { createClient } from '@/lib/supabase/server'
import { getTierLabel, getUserDisplayName } from '@/lib/user-display'

export default async function Navigation() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let viewer: { name: string; tierLabel: string } | null = null

  if (user) {
    const { data: member } = await supabase
      .from('members')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle<{ tier: MembershipTier }>()

    viewer = {
      name: getUserDisplayName(user),
      tierLabel: getTierLabel(member?.tier ?? 'free'),
    }
  }

  async function logoutAction() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <nav className="border-b border-stone-200/80 bg-[#f7f1e8]/95 text-stone-900 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-2xl px-2 py-1 transition hover:bg-white/50 active:scale-[0.98]"
        >
          <div className="font-serif text-3xl text-stone-900">{branding.appName}</div>
          <BrandLine compact className="mt-1 text-stone-500" />
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href={user ? '/trips' : '/'}
            className={buttonClass({
              variant: 'ghost',
              size: 'sm',
              className: 'rounded-full text-stone-700 hover:bg-white/70',
            })}
          >
            {user ? 'Stories' : 'Home'}
          </Link>

          {viewer ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-stone-700 shadow-sm">
                {viewer.name} - {viewer.tierLabel}
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={buttonClass({
                    variant: 'secondary',
                    size: 'sm',
                    className:
                      'rounded-full border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
                  })}
                >
                  Logout
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
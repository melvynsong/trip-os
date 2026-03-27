import { readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import BrandLine from '@/app/components/shared/BrandLine'
import { isOwnerTier } from '@/lib/membership/access'
import type { MembershipTier } from '@/lib/membership/types'
import { createClient } from '@/lib/supabase/server'

export default async function DeploymentFooter() {
  let deploymentTime = 'Latest version deployed'
  let showOwnerHistory = false

  try {
    // Read the build timestamp file created at build time
    const timestampFile = join(process.cwd(), 'public', 'build-timestamp.txt')
    deploymentTime = readFileSync(timestampFile, 'utf-8')
  } catch {
    // Fallback if file doesn't exist
    deploymentTime = 'Latest version deployed'
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: member } = await supabase
        .from('members')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle<{ tier: MembershipTier }>()

      showOwnerHistory = isOwnerTier(member?.tier ?? 'free')
    }
  } catch {
    showOwnerHistory = false
  }

  return (
    <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-600 mt-12">
      <BrandLine className="mb-1 text-gray-400" />
      <p>Version Deployed: {deploymentTime}</p>
      {showOwnerHistory ? (
        <p className="mt-2">
          <Link href="/owner/history" className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900">
            Owner History
          </Link>
        </p>
      ) : null}
    </footer>
  )
}


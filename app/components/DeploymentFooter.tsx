import { readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import BrandLine from '@/app/components/shared/BrandLine'
import { isOwnerTier } from '@/lib/membership/access'
import { getCurrentUserMembership } from '@/lib/membership/server'

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
    const membership = await getCurrentUserMembership()
    showOwnerHistory = isOwnerTier(membership.tier)
  } catch {
    showOwnerHistory = false
  }

  return (
    <footer className="mt-16 border-t border-[var(--border-soft)] bg-[var(--surface-muted)] py-6 text-center text-xs text-[var(--text-subtle)]">
      <BrandLine className="mb-2" />
      <p>{deploymentTime}</p>
      {showOwnerHistory ? (
        <p className="mt-2 flex items-center justify-center gap-4">
          <Link href="/admin" className="font-medium text-[var(--text-strong)] underline underline-offset-4 hover:text-[var(--brand-primary)]">
            Admin
          </Link>
          <Link href="/owner/history" className="font-medium text-[var(--text-strong)] underline underline-offset-4 hover:text-[var(--brand-primary)]">
            Owner History
          </Link>
        </p>
      ) : null}
    </footer>
  )
}


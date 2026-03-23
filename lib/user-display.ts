import type { User } from '@supabase/supabase-js'
import type { MembershipTier } from '@/lib/membership/types'

function cleanName(value: string | null | undefined) {
  if (!value) return null

  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null

  const withoutSymbols = trimmed.replace(/[0-9._-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!withoutSymbols) return null

  const firstWord = withoutSymbols.split(' ')[0]?.trim()
  if (!firstWord) return null

  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
}

function nameFromEmail(email: string | null | undefined) {
  if (!email) return 'Traveler'
  const local = email.split('@')[0] || ''
  const candidate = local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleanName(candidate) || 'Traveler'
}

export function getUserDisplayName(user: Pick<User, 'email' | 'user_metadata'> | null | undefined) {
  if (!user) return 'Traveler'

  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const candidates = [
    metadata.first_name,
    metadata.given_name,
    metadata.preferred_name,
    metadata.full_name,
    metadata.name,
    metadata.user_name,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const resolved = cleanName(candidate)
      if (resolved) return resolved
    }
  }

  return nameFromEmail(user.email)
}

export function getTierLabel(tier: MembershipTier | null | undefined) {
  if (tier === 'friend') return 'Friends Tier'
  if (tier === 'owner') return 'Owner Access'
  return 'Free Tier'
}

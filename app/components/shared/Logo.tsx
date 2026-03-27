import Image from 'next/image'
import Link from 'next/link'
import brandIcon from '@/public/branding/icon.png'
import brandLogo from '@/public/branding/logo.png'
import { cn } from '@/lib/utils/cn'

const HEIGHT_PX: Record<'sm' | 'md' | 'lg', number> = {
  sm: 40,
  md: 52,
  lg: 64,
}

const GAP_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'gap-2',
  md: 'gap-2.5',
  lg: 'gap-3',
}

// ─── Public component ─────────────────────────────────────────────────────────
type LogoProps = {
  href?: string
  variant?: 'full' | 'wordmark' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({
  href = '/',
  variant = 'full',
  size = 'md',
  className = '',
}: LogoProps) {
  const imageHeight = HEIGHT_PX[size]

  const content = (
    <span
      className={cn(
        'inline-flex items-center',
        variant === 'full' && GAP_CLASS[size],
        className
      )}
      aria-label="ToGoStory"
    >
      {(variant === 'full' || variant === 'icon') && (
        <Image
          src={brandIcon}
          alt={variant === 'icon' ? 'ToGoStory icon' : ''}
          aria-hidden={variant !== 'icon'}
          priority
          className="h-auto w-auto shrink-0"
          style={{ height: imageHeight }}
        />
      )}

      {(variant === 'full' || variant === 'wordmark') && (
        <Image
          src={brandLogo}
          alt={variant === 'wordmark' ? 'ToGoStory' : ''}
          aria-hidden={variant !== 'wordmark'}
          priority
          className="h-auto w-auto shrink-0"
          style={{ height: imageHeight }}
        />
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="ToGoStory – home">
        {content}
      </Link>
    )
  }

  return content
}

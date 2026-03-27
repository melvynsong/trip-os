import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

type LogoProps = {
  href?: string
  variant?: 'icon' | 'full' | 'wordmark'
  theme?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { icon: 24, full: 120, wordmark: 100 },
  md: { icon: 32, full: 180, wordmark: 150 },
  lg: { icon: 48, full: 280, wordmark: 220 },
}

const wordmarkClassMap = {
  sm: 'text-[1.9rem]',
  md: 'text-[2.8rem] sm:text-[3.2rem]',
  lg: 'text-[3.6rem] sm:text-[4.25rem]',
} as const

export default function Logo({
  href = '/',
  variant = 'full',
  theme = 'light',
  size = 'md',
  className = '',
}: LogoProps) {
  const textTone = theme === 'dark' ? 'text-white' : 'text-[var(--brand-primary)]'

  const wordmark = (
    <span
      className={cn(
        'inline-flex items-baseline font-sans font-semibold leading-none tracking-[-0.05em]',
        wordmarkClassMap[size],
        textTone,
        className
      )}
      aria-label="ToGoStory"
    >
      <span>ToGoStor</span>
      <span className="ml-[0.02em] text-[var(--brand-accent)]">y</span>
    </span>
  )

  if (variant === 'full' || variant === 'wordmark') {
    if (href) {
      return (
        <Link href={href} className="inline-flex items-center">
          {wordmark}
        </Link>
      )
    }

    return wordmark
  }

  const logoPath = {
    icon: theme === 'dark' ? '/logos/icon-white.svg' : '/logos/icon.svg',
    full: theme === 'dark' ? '/logos/full-logo-dark.svg' : '/logos/full-logo.svg',
    wordmark: '/logos/wordmark.svg',
  }[variant]

  const dimensions = sizeMap[size][variant]

  const logoImg = (
    <Image
      src={logoPath}
      alt="ToGoStory"
      width={dimensions}
      height={variant === 'icon' ? dimensions : Math.round(dimensions * 0.35)}
      priority
      className={className}
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoImg}
      </Link>
    )
  }

  return logoImg
}

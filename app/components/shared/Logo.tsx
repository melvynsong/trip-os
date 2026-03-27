import Image from 'next/image'
import Link from 'next/link'
import appIcon from '@/src/assets/app-icon.svg'
import fullLogo from '@/src/assets/logo.svg'
import { cn } from '@/lib/utils/cn'

type LogoProps = {
  href?: string
  variant?: 'icon' | 'full' | 'wordmark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: {
    icon: { width: 40, height: 40 },
    full: { width: 191, height: 40 },
    wordmark: { width: 191, height: 40 },
  },
  md: {
    icon: { width: 52, height: 52 },
    full: { width: 249, height: 52 },
    wordmark: { width: 249, height: 52 },
  },
  lg: {
    icon: { width: 64, height: 64 },
    full: { width: 306, height: 64 },
    wordmark: { width: 306, height: 64 },
  },
} as const

export default function Logo({
  href = '/',
  variant = 'full',
  size = 'md',
  className = '',
}: LogoProps) {
  const asset = variant === 'icon' ? appIcon : fullLogo
  const dimensions = sizeMap[size][variant]

  const logoImg = (
    <Image
      src={asset}
      alt="ToGoStory"
      width={dimensions.width}
      height={dimensions.height}
      priority
      className={cn('h-auto w-auto max-w-full', className)}
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

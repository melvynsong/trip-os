import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * ToGoStory brand Logo component.
 *
 * variant="full"      → icon mark + wordmark (default, nav & hero)
 * variant="wordmark"  → wordmark text only
 * variant="icon"      → icon mark only (app icon contexts)
 *
 * The icon is inline SVG — scales perfectly with CSS, zero font dependency.
 * The wordmark uses the page-loaded Inter font (font-extrabold).
 */

const BRAND_NAVY = '#1A4F8A'
const BRAND_ORANGE = '#F4A261'

// ─── Icon mark ────────────────────────────────────────────────────────────────
// Two ribbon-style bezier paths that weave through each other, forming the
// abstract "journey" interwoven loop mark.
function IconMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {/* Path 1 – upper-left dominant loop */}
      <path
        d="M 65,60 C 62,40 46,24 28,30 C 10,36 8,60 22,74 C 36,88 60,86 68,70 C 76,54 72,36 60,28"
        stroke={BRAND_NAVY}
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Path 2 – lower-right dominant loop (renders over path 1 at crossings) */}
      <path
        d="M 55,60 C 58,80 74,96 92,90 C 110,84 112,60 98,46 C 84,32 60,34 52,50 C 44,66 48,84 60,92"
        stroke={BRAND_NAVY}
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────
// "ToGoStory" in Inter ExtraBold with an orange accent dot floating inside
// the counter of the "o" in "Story".
const TEXT_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-[1.65rem]',
  md: 'text-[2.1rem]',
  lg: 'text-[2.75rem]',
}

function Wordmark({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-sans font-extrabold leading-none tracking-[-0.04em]',
        TEXT_CLASS[size]
      )}
      style={{ color: BRAND_NAVY }}
    >
      <span>ToGoSt</span>

      {/* The accent "o" — orange dot sits inside the letter counter */}
      <span className="relative inline-block">
        o
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ paddingBottom: '0.06em' }}
        >
          <span
            className="block rounded-full"
            style={{ width: '0.26em', height: '0.32em', background: BRAND_ORANGE }}
          />
        </span>
      </span>

      <span>ry</span>
    </span>
  )
}

// ─── Icon pixel sizes ─────────────────────────────────────────────────────────
const ICON_PX: Record<'sm' | 'md' | 'lg', number> = {
  sm: 30,
  md: 38,
  lg: 50,
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
  const showIcon = variant === 'full' || variant === 'icon'
  const showWord = variant === 'full' || variant === 'wordmark'

  const content = (
    <span
      className={cn(
        'inline-flex items-center',
        variant === 'full' && 'gap-2',
        className
      )}
      aria-label="ToGoStory"
    >
      {showIcon && <IconMark size={ICON_PX[size]} />}
      {showWord && <Wordmark size={size} />}
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

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[var(--brand-primary)] text-white shadow-[0_6px_20px_rgba(30,107,114,0.32)] hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-press)] active:shadow-none',
  secondary:
    'border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--text-strong)] shadow-sm hover:bg-[var(--surface-muted)] active:shadow-none',
  ghost:
    'border-transparent bg-transparent text-[var(--text-strong)] hover:bg-[var(--surface-muted)] active:bg-[var(--border-soft)]',
  danger:
    'border-transparent bg-red-700 text-white shadow-sm hover:bg-red-800 active:bg-red-900 active:shadow-none',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function buttonClass(options?: {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  className?: string
}) {
  const variant = options?.variant ?? 'secondary'
  const size = options?.size ?? 'md'

  return cn(
    'inline-flex min-w-[44px] items-center justify-center gap-2 rounded-2xl border font-medium tracking-[-0.01em] transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    options?.className
  )
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export default function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass({ variant, size, loading, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}

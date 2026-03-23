import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.26)] hover:bg-[linear-gradient(135deg,#0284c7,#1d4ed8)] active:bg-[linear-gradient(135deg,#0369a1,#1e40af)] active:shadow-none',
  secondary:
    'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-200 hover:bg-sky-50/60 active:bg-sky-100/70 active:shadow-none',
  ghost:
    'border-transparent bg-transparent text-slate-700 hover:bg-sky-50/70 active:bg-sky-100/80',
  danger:
    'border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 active:shadow-none',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
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
    'inline-flex min-w-[44px] items-center justify-center gap-2 rounded-2xl border font-medium transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 disabled:pointer-events-none disabled:opacity-50',
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

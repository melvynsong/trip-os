import * as React from 'react'
import { cn } from '../../../lib/utils/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export default function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[0_2px_12px_rgba(28,25,23,0.06)] transition-all duration-200',
        interactive && 'hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(28,25,23,0.1)] active:scale-[0.995]',
        className
      )}
      {...props}
    />
  )
}

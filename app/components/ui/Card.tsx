import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export default function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[0_10px_28px_rgba(20,33,61,0.08)] transition-all duration-200',
        interactive && 'hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(20,33,61,0.12)] active:scale-[0.995]',
        className
      )}
      {...props}
    />
  )
}

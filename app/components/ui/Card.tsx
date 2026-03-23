import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export default function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,0.08)] transition-all duration-200',
        interactive && 'hover:-translate-y-0.5 hover:shadow-[0_24px_64px_rgba(14,116,144,0.14)] active:scale-[0.995]',
        className
      )}
      {...props}
    />
  )
}

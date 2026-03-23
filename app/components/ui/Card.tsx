import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export default function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(41,31,24,0.05)] transition-all duration-200',
        interactive && 'hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(41,31,24,0.09)] active:scale-[0.995]',
        className
      )}
      {...props}
    />
  )
}

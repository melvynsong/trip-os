import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export default function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200',
        interactive && 'hover:shadow-md active:scale-[0.995] active:shadow-sm',
        className
      )}
      {...props}
    />
  )
}

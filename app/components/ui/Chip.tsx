import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export default function Chip({ className, selected = false, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-full border px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
        selected
          ? 'border-black bg-black text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100',
        className
      )}
      {...props}
    />
  )
}

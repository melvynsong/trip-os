import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const baseFieldClass =
  'w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)]'

export function FormField({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--text-strong)]">{label}</span>
      <input {...props} className={cn(baseFieldClass, className)} />
      {hint ? <span className="text-xs text-[var(--text-subtle)]">{hint}</span> : null}
    </label>
  )
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--text-strong)]">{label}</span>
      <textarea {...props} className={cn(baseFieldClass, className)} />
      {hint ? <span className="text-xs text-[var(--text-subtle)]">{hint}</span> : null}
    </label>
  )
}

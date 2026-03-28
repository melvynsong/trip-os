type TimeOfDaySectionProps = {
  label: string
  children: React.ReactNode
}

export default function TimeOfDaySection({ label, children }: TimeOfDaySectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

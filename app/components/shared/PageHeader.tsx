type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4 sm:flex sm:items-start sm:justify-between sm:space-y-0">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

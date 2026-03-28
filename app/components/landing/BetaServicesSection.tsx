import ServiceCard, { type ServiceCardData } from '@/app/components/landing/ServiceCard'

// ─── Inline SVG icons ──────────────────────────────────────────────────────────

function FlightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M22 16.21v-1.895l-9-5.25V3.5a1.5 1.5 0 0 0-3 0v5.565l-9 5.25v1.895l9-2.75V19l-2.25 1.5V22L12 21l3.25 1v-1.5L13 19v-5.535l9 2.746z" />
    </svg>
  )
}

function PackingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="2" y1="13" x2="22" y2="13" />
      <line x1="9" y1="10" x2="9" y2="16" />
      <line x1="15" y1="10" x2="15" y2="16" />
    </svg>
  )
}

function MeetUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// ─── Service definitions ──────────────────────────────────────────────────────

const services: (ServiceCardData & { iconAccent?: 'blue' | 'orange' })[] = [
  {
    title: 'Add Flight',
    description:
      'Bring your flight details into your journey and structure them neatly into your travel story.',
    icon: <FlightIcon />,
    iconAccent: 'blue',
  },
  {
    title: 'Packing List',
    description:
      'Build a smarter packing checklist based on your destination, duration, and trip context.',
    icon: <PackingIcon />,
    iconAccent: 'blue',
  },
  {
    title: 'Meet-Up',
    description:
      'Organise meaningful gatherings — from dinner plans to social meet-ups — in a more intentional way.',
    icon: <MeetUpIcon />,
    iconAccent: 'orange',
  },
]

// ─── Section ──────────────────────────────────────────────────────────────────

export default function BetaServicesSection() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="max-w-2xl space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            Free Beta Services
          </p>
          <span className="rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-accent)]">
            Beta
          </span>
          <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
            Coming Soon
          </span>
        </div>
        <h2 className="font-serif text-3xl leading-snug text-[var(--text-strong)]">
          Standalone tools built alongside the journey.
        </h2>
        <p className="text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
          Extending your journey beyond planning — purpose-built tools that complement the core ToGoStory experience, available free as they come to life.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.title}
            title={service.title}
            description={service.description}
            icon={service.icon}
            iconAccent={service.iconAccent}
          />
        ))}
      </div>

      {/* Closing note */}
      <p className="text-center text-xs font-medium tracking-wide text-[var(--text-subtle)]">
        More thoughtful tools are on the way.
      </p>
    </section>
  )
}

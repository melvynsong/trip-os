type TripDateLike = {
  start_date: string
  end_date: string
}

function fromIsoDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(isoDate: string, days: number): string | null {
  const date = fromIsoDate(isoDate)
  if (!date) return null
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function getSuggestedEndDate(startDate: string, tripDays = 4): string | null {
  const offset = Math.max(1, tripDays - 1)
  return addDays(startDate, offset)
}

export function isEndDateAfterStartDate(startDate: string, endDate: string): boolean {
  const start = fromIsoDate(startDate)
  const end = fromIsoDate(endDate)
  if (!start || !end) return false
  return end.getTime() > start.getTime()
}

export function getMinEndDate(startDate: string): string | null {
  return addDays(startDate, 1)
}

export function getCountdownLabel(startDate: string): string | null {
  const start = fromIsoDate(startDate)
  if (!start) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = start.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return null
  if (diffDays === 0) return 'Starting today'
  if (diffDays === 1) return 'Starting tomorrow'
  return `Your trip is starting in ${diffDays} days`
}

export function sortTripsByStartDate<T extends TripDateLike>(trips: T[]): T[] {
  return [...trips].sort((a, b) => {
    const aStart = fromIsoDate(a.start_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const bStart = fromIsoDate(b.start_date)?.getTime() ?? Number.MAX_SAFE_INTEGER

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const aIsPast = aStart < today
    const bIsPast = bStart < today

    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1

    if (!aIsPast && !bIsPast) {
      return aStart - bStart
    }

    return bStart - aStart
  })
}

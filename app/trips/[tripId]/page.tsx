import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonClass } from '@/app/components/ui/Button'
import DaySection from '@/app/components/trips/story/DaySection'
import StoryGenerator from '@/app/components/trips/story/StoryGenerator'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
import TripWeatherSection from '@/app/components/trips/story/TripWeatherSection'
import { WeatherDataProvider } from '@/app/components/trips/story/WeatherDataProvider'
import Card from '@/app/components/ui/Card'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { getFlightAccessState, getPackingAccessState } from '@/lib/feature-toggles'
import { transformActivitiesForTimeline } from '@/lib/trips/timeline-shared'
import {
  Trip as TripType,
  Day as DayType,
  Activity as ActivityType,
  Place as PlaceType,
  const { tripId } = await params
  redirect(`/trips/${tripId}/itinerary`)
                  href={`/trips/${tripId}/places`}
                  className={buttonClass({ variant: 'secondary', className: 'rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]' })}
                >
                  Explore places
                </Link>
                {canSeeFlightLink ? (
                  <Link
                    href={`/trips/${tripId}/flight`}
                    className={buttonClass({ variant: 'secondary', className: 'rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]' })}
                  >
                    Add flight <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
                    {savedFlightCount > 0 ? <span className="ml-1 text-xs text-[var(--text-subtle)]">· {savedFlightCount} saved</span> : null}
                  </Link>
                ) : null}
                {canSeePackingLink ? (
                  <Link
                    href={`/trips/${tripId}/packing`}
                    className={buttonClass({ variant: 'secondary', className: 'rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]' })}
                  >
                    Packing list <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
                  </Link>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
        </WeatherDataProvider>
    </TripPageShell>
  )
}

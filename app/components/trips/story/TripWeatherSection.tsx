"use client";
import type { WeatherApiResponse, WeatherMode, WeatherPeriodConditions } from '@/lib/weather/types';
import Card from '@/app/components/ui/Card';
import EmptyState from '@/app/components/ui/EmptyState';
import { LoadingSkeleton } from '@/app/components/ui/LoadingSkeleton';
import { useWeather } from '@/lib/weather/useWeather';

type TripWeatherSectionProps = {
  destination: string;
  startDate: string;
  endDate: string;
  tripId?: string;
};

function ConfidenceBadge({ mode }: { mode: WeatherMode }) {
  const styles: Record<WeatherMode, string> = {
    forecast: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    outlook: 'bg-amber-100 text-amber-700 ring-amber-200',
    climate: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  const labels: Record<WeatherMode, string> = {
    forecast: 'Daily forecast',
    outlook: 'Early outlook',
    climate: 'Typical conditions',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[mode]}`}>
      {labels[mode]}
    </span>
  );
}

function WeatherLoadingSkeleton() {
  return (
    <Card className="space-y-5 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <LoadingSkeleton className="h-5 w-24 rounded-full" />
          <LoadingSkeleton className="h-7 w-48" />
        </div>
      </div>
      <LoadingSkeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-2.5">
        <LoadingSkeleton className="h-12 w-full rounded-lg" />
        <LoadingSkeleton className="h-12 w-full rounded-lg" />
        <LoadingSkeleton className="h-12 w-full rounded-lg" />
      </div>
    </Card>
  );
}

function formatDisplayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function PeriodConditionsBlock({ conditions }: { conditions: WeatherPeriodConditions }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-[var(--border-soft)] rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] overflow-hidden">
      <div className="flex flex-col items-center gap-0.5 px-3 py-3">
        <p className="text-lg font-semibold text-[var(--text-strong)]">{conditions.avgMaxTempC}°</p>
        <p className="text-xs text-[var(--text-subtle)]">High</p>
      </div>
      <div className="flex flex-col items-center gap-0.5 px-3 py-3">
        <p className="text-lg font-semibold text-[var(--text-strong)]">{conditions.avgMinTempC}°</p>
        <p className="text-xs text-[var(--text-subtle)]">Low</p>
      </div>
      <div className="flex flex-col items-center gap-0.5 px-3 py-3">
        <p className="text-lg font-semibold text-[var(--text-strong)]">{conditions.rainyDaysPercent}%</p>
        <p className="text-xs text-[var(--text-subtle)]">Rainy days</p>
      </div>
      <div className="col-span-3 border-t border-[var(--border-soft)] px-4 py-2.5">
        <p className="text-sm font-medium text-[var(--text-strong)]">{conditions.typicalCondition}</p>
      </div>
    </div>
  );
}

function WeatherCardShell({ payload, children }: { payload: WeatherApiResponse; children: React.ReactNode }) {
  return (
    <Card className="space-y-5 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
      {/* Header */}
      <div className="space-y-2">
        <ConfidenceBadge mode={payload.mode} />
        <h2 className="text-xl font-serif text-[var(--text-strong)]">{payload.locationLabel}</h2>
      </div>
      {/* Context note for non-forecast modes */}
      {payload.contextNote ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
          {payload.contextNote}
        </div>
      ) : null}
      {/* Summary */}
      <div className="rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary-soft)] px-4 py-3.5">
        <p className="text-sm font-semibold text-[var(--text-strong)]">{payload.summary.headline}</p>
        {payload.summary.note ? (
          <p className="mt-1.5 text-xs text-[var(--text-subtle)]">{payload.summary.note}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export default function TripWeatherSection({ destination, startDate, endDate, tripId }: TripWeatherSectionProps) {
  const { loading, error, payload } = useWeather({ destination, startDate, endDate, tripId });

  if (loading) {
    return <WeatherLoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-1.5">
          <ConfidenceBadge mode="forecast" />
          <h2 className="text-xl font-serif text-[var(--text-strong)]">Weather unavailable</h2>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      </Card>
    );
  }

  if (!payload) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <EmptyState
          title="No weather data"
          description="Data will appear closer to your travel dates."
          className="p-5 text-sm"
        />
      </Card>
    );
  }

  // FORECAST mode — day-by-day rows
  if (payload.mode === 'forecast') {
    if (payload.days.length === 0) {
      return (
        <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
          <div className="space-y-1.5">
            <ConfidenceBadge mode="forecast" />
            <h2 className="text-xl font-serif text-[var(--text-strong)]">No forecast yet</h2>
          </div>
          <EmptyState
            title={payload.summary.headline}
            description={payload.summary.note || 'Data will appear closer to your travel dates.'}
            className="p-5 text-sm"
          />
        </Card>
      );
    }
    return (
      <WeatherCardShell payload={payload}>
        <div className="space-y-2">
          {payload.days.map((day: any) => (
            <div
              key={day.date}
              className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3.5 py-3 transition-colors hover:bg-[var(--surface-muted)]/70"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-[var(--text-subtle)]">
                  {formatDisplayDate(day.date)}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text-strong)]">
                  {day.conditionLabel}
                </p>
              </div>
              <div className="ml-3 flex items-baseline gap-1 text-right">
                <p className="text-base font-semibold text-[var(--text-strong)]">{day.maxTempC}°</p>
                <p className="text-sm text-[var(--text-subtle)]">{day.minTempC}°</p>
                {day.rainProbability !== null && (
                  <span className="ml-2 rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-primary)]">
                    {day.rainProbability}% rain
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </WeatherCardShell>
    );
  }

  // OUTLOOK / CLIMATE modes — aggregate period conditions
  if (!payload.periodConditions) {
    return (
      <WeatherCardShell payload={payload}>
        <EmptyState
          title="Typical conditions unavailable"
          description="We could not retrieve historical data for this destination."
          className="p-5 text-sm"
        />
      </WeatherCardShell>
    );
  }

  return (
    <WeatherCardShell payload={payload}>
      <PeriodConditionsBlock conditions={payload.periodConditions as WeatherPeriodConditions} />
    </WeatherCardShell>
  );
}
  if (error) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-1.5">
          <ConfidenceBadge mode="forecast" />
          <h2 className="text-xl font-serif text-[var(--text-strong)]">Weather unavailable</h2>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      </Card>
    )
  }

  if (!payload) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <EmptyState
          title="No weather data"
          description="Data will appear closer to your travel dates."
          className="p-5 text-sm"
        />
      </Card>
    )
  }

  // -------------------------------------------------------------------
  // FORECAST mode — day-by-day rows
  // -------------------------------------------------------------------
  if (payload.mode === 'forecast') {
    if (payload.days.length === 0) {
      return (
        <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
          <div className="space-y-1.5">
            <ConfidenceBadge mode="forecast" />
            <h2 className="text-xl font-serif text-[var(--text-strong)]">No forecast yet</h2>
          </div>
          <EmptyState
            title={payload.summary.headline}
            description={payload.summary.note || 'Data will appear closer to your travel dates.'}
            className="p-5 text-sm"
          />
        </Card>
      )
    }

    return (
      <WeatherCardShell payload={payload}>
        <div className="space-y-2">
          {payload.days.map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3.5 py-3 transition-colors hover:bg-[var(--surface-muted)]/70"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-[var(--text-subtle)]">
                  {formatDisplayDate(day.date)}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text-strong)]">
                  {day.conditionLabel}
                </p>
              </div>
              <div className="ml-3 flex items-baseline gap-1 text-right">
                <p className="text-base font-semibold text-[var(--text-strong)]">{day.maxTempC}°</p>
                <p className="text-sm text-[var(--text-subtle)]">{day.minTempC}°</p>
                {day.rainProbability !== null && (
                  <span className="ml-2 rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-primary)]">
                    {day.rainProbability}% rain
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </WeatherCardShell>
    )
  }

  // -------------------------------------------------------------------
  // OUTLOOK / CLIMATE modes — aggregate period conditions
  // -------------------------------------------------------------------
  if (!payload.periodConditions) {
    return (
      <WeatherCardShell payload={payload}>
        <EmptyState
          title="Typical conditions unavailable"
          description="We could not retrieve historical data for this destination."
          className="p-5 text-sm"
        />
      </WeatherCardShell>
    )
  }

  return (
    <WeatherCardShell payload={payload}>
      <PeriodConditionsBlock conditions={payload.periodConditions} />
    </WeatherCardShell>
  )
}
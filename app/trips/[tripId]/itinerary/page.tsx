export const dynamic = 'force-dynamic';
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import DayCard from '@/app/components/itinerary/DayCard'
import { getEnglishDestinationName } from '@/lib/utils/englishDestination'
import { fetchTripWeather } from '@/lib/weather/fetchTripWeather'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import TripHeader from '@/app/components/trips/TripHeader'
import TripWeatherSection from '@/app/components/trips/story/TripWeatherSection'
import TripPageShell from '@/app/components/trips/TripPageShell'
import { buttonClass } from '@/app/components/ui/Button'
import { resolvePlaceType } from '@/lib/places'
import { formatTripForWhatsApp } from '@/lib/share/whatsapp'
import { Trip as TripType, Day as DayType, Activity as ActivityType, Place as PlaceType } from '@/types/trip'
import { listTripFlights } from '@/lib/flights/trip'

type Props = {
  params: { tripId: string } | Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'> & {
  latitude: number | null;
  longitude: number | null;
}
type Day = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>
type Activity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id' | 'created_at'
> & {
  metadata?: any;
  places: { id: string; name: string } | null
}
type Place = Pick<PlaceType, 'id' | 'name' | 'category' | 'place_type'>

export default async function ItineraryPage({ params }: Props) {
  let errorDetails: any = null;
  let tripId: string | undefined = undefined;
  let user: any = null;
  let trip: Trip | null = null;
  let days: Day[] | null = null;
  let activities: Activity[] = [];
  let places: Place[] | null = null;
  let hotel: string | null = null;
  let weatherByDate: Record<string, any> = {};
  let shareDays: any[] = [];
  let shortTripShareText = '';
  let detailedTripShareText = '';
  let englishDestination = '';
  const step = (label: string, fn: () => Promise<void>) => fn().catch(err => {
    errorDetails = { step: label, error: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined };
    throw err;
  });
  try {
    await step('resolve tripId', async () => {
      if (typeof params === 'object' && 'then' in params && typeof params.then === 'function') {
        const resolved = await params;
        tripId = resolved?.tripId;
      } else {
        tripId = (params as { tripId?: string })?.tripId;
      }
    });
    const supabase = await createClient();
    await step('fetch user', async () => {
      const userResult = await supabase.auth.getUser();
      user = userResult.data.user;
      if (!user) redirect('/');
    });
    await step('fetch trip', async () => {
      const tripResult = await supabase
        .from('trips')
        .select('id, title, destination, start_date, end_date, latitude, longitude')
        .eq('id', tripId)
        .single<Trip>();
      trip = tripResult.data;
      if (tripResult.error || !trip) throw new Error(tripResult.error?.message || 'Trip not found');
    });
    await step('fetch days', async () => {
      const daysResult = await supabase
        .from('days')
        .select('id, trip_id, day_number, date, title')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .returns<Day[]>();
      days = daysResult.data;
      if (daysResult.error) throw new Error(daysResult.error.message);
      if (!days || days.length === 0) throw new Error('No itinerary days found for this trip.');
    });
    await step('fetch activities', async () => {
      const dayIds = days!.map((day: any) => day.id);
      const activitiesResult = await supabase
        .from('activities')
        .select('id, day_id, title, activity_time, type, notes, sort_order, place_id, created_at, metadata, places(id, name)')
        .in('day_id', dayIds)
        .order('day_id', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .returns<Activity[]>();
      if (activitiesResult.error) throw new Error(activitiesResult.error.message);
      activities = activitiesResult.data || [];
    });
    await step('fetch places', async () => {
      const placesResult = await supabase
        .from('places')
        .select('id, name, category, place_type')
        .eq('trip_id', tripId)
        .returns<Place[]>();
      places = placesResult.data;
      hotel = places?.find((place: any) => resolvePlaceType(place) === 'hotel')?.name ?? null;
    });
    await step('fetch weather', async () => {
      if (trip && days && days.length > 0) {
        try {
          weatherByDate = await fetchTripWeather(
            trip.destination,
            trip.start_date,
            trip.end_date,
            trip.latitude,
            trip.longitude
          );
        } catch (err) {
          errorDetails = { step: 'fetch weather', error: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined };
        }
      }
    });
    await step('share text', async () => {
      shareDays = days!.map((day: any) => {
        const dayActivities = activities.filter((activity) => activity.day_id === day.id);
        return {
          dayNumber: day.day_number,
          date: day.date,
          city: trip!.destination,
          title: day.title,
          hotel,
          activities: dayActivities.map((activity) => ({
            title: activity.title,
            activity_time: activity.activity_time,
            type: activity.type,
            notes: activity.notes,
            placeName: activity.places?.name ?? null,
          })),
        };
      });
      const tripShareInput = {
        tripTitle: trip!.title,
        startDate: trip!.start_date,
        endDate: trip!.end_date,
        destinations: [trip!.destination],
        hotel,
        days: shareDays,
      };
      shortTripShareText = formatTripForWhatsApp(tripShareInput, { length: 'short' });
      detailedTripShareText = formatTripForWhatsApp(tripShareInput, { length: 'detailed' });
    });
    englishDestination = getEnglishDestinationName(trip!.destination);
  } catch (err) {
    // Ultra-granular error logging for server errors
    console.error('[ItineraryPage][SERVER][FATAL-GRANULAR]', {
      ...errorDetails,
      params,
      timestamp: new Date().toISOString(),
    });
    return (
      <TripPageShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <b>Server Error:</b> {errorDetails?.error || (err instanceof Error ? err.message : String(err))}
          <br />
          <b>Step:</b> {errorDetails?.step || 'unknown'}
          <br />
          <span className="text-xs">Stack: {errorDetails?.stack?.slice(0, 500) || 'n/a'}</span>
        </div>
      </TripPageShell>
    );
  }
  // Main page render
    return (
      <TripPageShell className="space-y-8">
        <TripHeader
          dateRange={`${trip!.start_date} → ${trip!.end_date}`}
          title={trip!.title}
          subtitle={englishDestination}
          backHref={`/trips/${tripId}`}
          backLabel="Back to Trip"
          actions={
          <>
            <Link
              href={`/trips/${tripId}/today`}
              className={buttonClass({
                size: 'sm',
                variant: 'primary',
                className: 'rounded-full',
              })}
            >
              📍 Today
            </Link>
            <Link
              href={`/trips/${tripId}/ai-itinerary`}
              className={buttonClass({
                size: 'sm',
                variant: 'secondary',
                className: 'rounded-full',
              })}
            >
              AI Generate Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/packing-list`}
              className={buttonClass({
                size: 'sm',
                variant: 'secondary',
                className: 'rounded-full',
              })}
            >
              🧳 Packing List
            </Link>
            <WhatsAppShareSheet
              title={`Share ${trip.title} itinerary`}
              shortText={shortTripShareText}
              detailedText={detailedTripShareText}
              triggerLabel="Share itinerary"
              triggerClassName={buttonClass({
                size: 'sm',
                variant: 'secondary',
                className: 'rounded-full',
              })}
            />
          </>
        }
      />
      {/* Weather summary removed: now shown per day card */}
      <div className="space-y-6">
        {days.map((day: any) => {
          const dayActivities = activities.filter((activity) => activity.day_id === day.id);
          // Normalize date to YYYY-MM-DD (avoid timezone bugs)
          const dateKey = String(day.date).slice(0, 10);
          const weather = weatherByDate[dateKey] || null;
          return (
            <DayCard
              key={day.id}
              tripId={tripId!}
              tripTitle={trip.title}
              destination={englishDestination}
              hotel={hotel}
              day={day}
              activities={dayActivities}
              weather={weather}
            />
          );
        })}
      </div>
    </TripPageShell>
  );
}
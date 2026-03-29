import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserFlightAccessState, getFlightAccessMessage } from '@/lib/flights/access'
import { listTripFlights, saveUnifiedTripFlight, deleteUnifiedTripFlight } from '@/lib/flights/trip'
import type { FlightActivity } from '@/lib/trips/flight-activity'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tripId: string }> }


type SaveFlightPayload = {
  flight?: unknown;
};

function parseFlight(input: unknown): FlightActivity | null {
  if (typeof input !== 'object' || input === null) return null
  return input as FlightActivity
}

async function verifyTripOwnership(tripId: string, userId: string) {
  const supabase = await createClient()
  const { data: trip, error } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single()

  if (error || !trip) {
    return null
  }

  return { supabase, trip }
}

export async function GET(_: Request, { params }: Params) {
  let response;
  try {
    const { tripId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      response = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    } else {
      const access = await getCurrentUserFlightAccessState().catch(() => null);
      if (!access) {
        response = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      } else if (!access.canAccess) {
        response = NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 });
      } else {
        const ownedTrip = await verifyTripOwnership(tripId, user.id);
        if (!ownedTrip) {
          response = NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
        } else {
          const flights = await listTripFlights(ownedTrip.supabase, tripId);
          response = NextResponse.json({ flights });
        }
      }
    }
  } catch (error) {
    response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    );
  }
  return response;
}

export async function POST(request: Request, { params }: Params) {
  let response;
  try {
    const { tripId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      response = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    } else {
      const access = await getCurrentUserFlightAccessState().catch(() => null);
      if (!access) {
        response = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      } else if (!access.canAccess) {
        response = NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 });
      } else {
        const ownedTrip = await verifyTripOwnership(tripId, user.id);
        if (!ownedTrip) {
          response = NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
        } else {
          const body = (await request.json().catch(() => null)) as SaveFlightPayload | null;
          const flight = parseFlight(body?.flight);
          if (!flight) {
            response = NextResponse.json({ error: 'Flight data is required.' }, { status: 400 });
          } else {
            // Insert the unified flight activity
            const savedFlight = await saveUnifiedTripFlight({
              supabase: ownedTrip.supabase,
              tripId,
              flight,
            });
            revalidatePath(`/trips/${tripId}`);
            revalidatePath(`/trips/${tripId}/flight`);
            revalidatePath(`/trips/${tripId}/itinerary`);
            response = NextResponse.json({ flight: savedFlight });
          }
        }
      }
    }
  } catch (error) {
    response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    );
  }
  return response;
}

type DeleteFlightPayload = {
  id?: string
}



export async function DELETE(request: Request, { params }: Params) {
  let response;
  try {
    const { tripId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      response = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    } else {
      const access = await getCurrentUserFlightAccessState().catch(() => null);
      if (!access) {
        response = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      } else if (!access.canAccess) {
        response = NextResponse.json({ error: getFlightAccessMessage(access) }, { status: 403 });
      } else {
        const ownedTrip = await verifyTripOwnership(tripId, user.id);
        if (!ownedTrip) {
          response = NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
        } else {
          const body = (await request.json().catch(() => null)) as DeleteFlightPayload | null;
          const id = body?.id;
          if (!id) {
            response = NextResponse.json({ error: 'Flight id is required.' }, { status: 400 });
          } else {
            await deleteUnifiedTripFlight({
              supabase: ownedTrip.supabase,
              tripId,
              id,
            });
            revalidatePath(`/trips/${tripId}`);
            revalidatePath(`/trips/${tripId}/flight`);
            response = NextResponse.json({ success: true });
          }
        }
      }
    }
  } catch (error) {
    response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 }
    );
  }
  return response;
}
}

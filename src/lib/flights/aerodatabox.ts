import type { FlightLookupInput } from './types'

type LookupFlightResponse = {
  data?: unknown[]
}

export class AeroDataBoxApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'AeroDataBoxApiError'
    this.status = status
  }
}

function getEnv(name: 'AERODATABOX_API_KEY' | 'AERODATABOX_HOST'): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new AeroDataBoxApiError(`${name} is not configured.`, 500)
  }

  return value
}

function getAeroDataBoxBaseUrl(): string {
  return process.env.AERODATABOX_BASE_URL?.trim() || 'https://aerodatabox.p.rapidapi.com'
}

export async function lookupAeroDataBoxFlight(
  input: FlightLookupInput & { normalizedFlightNumber: string }
): Promise<LookupFlightResponse> {
  const apiKey = getEnv('AERODATABOX_API_KEY')
  const host = getEnv('AERODATABOX_HOST')
  const path = `/flights/number/${encodeURIComponent(input.normalizedFlightNumber)}/${encodeURIComponent(input.flightDate)}?withAircraftImage=false&withLocation=false`

  const response = await fetch(`${getAeroDataBoxBaseUrl()}${path}`, {
    headers: {
      Accept: 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': host,
    },
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; errors?: Array<{ message?: string; detail?: string }> }
    | unknown

  if (!response.ok) {
    const errorPayload = payload as { message?: string; errors?: Array<{ message?: string; detail?: string }> } | null
    const message =
      errorPayload?.errors?.[0]?.detail ||
      errorPayload?.errors?.[0]?.message ||
      errorPayload?.message ||
      'AeroDataBox request failed.'

    throw new AeroDataBoxApiError(message, response.status || 502)
  }

  if (Array.isArray(payload)) {
    return { data: payload }
  }

  if (typeof payload === 'object' && payload !== null && Array.isArray((payload as LookupFlightResponse).data)) {
    return payload as LookupFlightResponse
  }

  return { data: [] }
}

// Utility to get the local date (YYYY-MM-DD) from an ISO datetime string and IANA timezone
// Uses date-fns-tz for robust timezone handling
import { toZonedTime, format } from 'date-fns-tz';

/**
 * Returns the local date (YYYY-MM-DD) in the given timezone for a datetime string.
 * @param isoDatetime ISO 8601 datetime string (e.g. 2026-03-29T18:55:00+08:00 or 2026-03-29T10:55:00Z)
 * @param timezone IANA timezone string (e.g. 'Asia/Singapore')
 * @returns Local date string in YYYY-MM-DD format
 */
export function getLocalDateFromIsoDatetime(isoDatetime: string, timezone: string): string {
  if (!isoDatetime) return ''
  // Normalize to ISO format if space-separated (e.g. '2026-03-30 07:25+08:00' -> '2026-03-30T07:25:00+08:00')
  let normalized = isoDatetime
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?([+-]\d{2}:?\d{2})?$/.test(isoDatetime)) {
    normalized = isoDatetime.replace(' ', 'T')
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}([+-]\d{2}:?\d{2})?$/.test(normalized)) {
      // Add seconds if missing
      normalized = normalized.replace(/(T\d{2}:\d{2})([+-]\d{2}:?\d{2})$/, '$1:00$2')
    }
  }
  if (!timezone) {
    // Fallback: extract date from ISO string in UTC
    if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
      return normalized.slice(0, 10)
    }
    return ''
  }
  try {
    const utcDate = new Date(normalized)
    const zoned = toZonedTime(utcDate, timezone)
    return format(zoned, 'yyyy-MM-dd', { timeZone: timezone })
  } catch (e) {
    if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
      return normalized.slice(0, 10)
    }
    return ''
  }
}

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
  if (!timezone) {
    // Fallback: extract date from ISO string in UTC
    if (/^\d{4}-\d{2}-\d{2}/.test(isoDatetime)) {
      return isoDatetime.slice(0, 10)
    }
    return ''
  }
  try {
    // Use new Date(isoDatetime) for robust UTC parsing, then convert to target timezone
    const utcDate = new Date(isoDatetime)
    const zoned = toZonedTime(utcDate, timezone)
    return format(zoned, 'yyyy-MM-dd', { timeZone: timezone })
  } catch (e) {
    // Fallback: extract date from ISO string in UTC
    if (/^\d{4}-\d{2}-\d{2}/.test(isoDatetime)) {
      return isoDatetime.slice(0, 10)
    }
    return ''
  }
}

import { describe, it, expect } from 'vitest';

// Helper functions from ActivityFlightInput (copy for test context)
function getLocalDateString(dateTime: string | null): string | null {
  if (!dateTime) return null;
  // If ISO string with offset, extract local date part before 'T'
  const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (match) return match[1];
  // Fallback: try parsing as Date (may be UTC)
  const d = new Date(dateTime);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function getFlightLocalDates(flight: { departureTime?: string | null, arrivalTime?: string | null }) {
  return {
    departureDate: getLocalDateString(flight.departureTime || null),
    arrivalDate: getLocalDateString(flight.arrivalTime || null),
  };
}

function classifyFlightAgainstPageDate(pageDate: string, departureDate: string | null, arrivalDate: string | null): 'departure' | 'arrival' | 'same-day' | 'neither' {
  if (pageDate === departureDate && pageDate === arrivalDate) return 'same-day';
  if (pageDate === departureDate) return 'departure';
  if (pageDate === arrivalDate) return 'arrival';
  return 'neither';
}

describe('Flight day alignment', () => {
  it('same-day flight', () => {
    const flight = {
      departureTime: '2026-03-30T10:00:00+08:00',
      arrivalTime: '2026-03-30T13:00:00+08:00',
    };
    const { departureDate, arrivalDate } = getFlightLocalDates(flight);
    expect(departureDate).toBe('2026-03-30');
    expect(arrivalDate).toBe('2026-03-30');
    expect(classifyFlightAgainstPageDate('2026-03-30', departureDate, arrivalDate)).toBe('same-day');
  });

  it('cross-midnight flight, pageDate matches departure', () => {
    const flight = {
      departureTime: '2026-03-30T19:50:00+08:00',
      arrivalTime: '2026-03-31T00:15:00+08:00',
    };
    const { departureDate, arrivalDate } = getFlightLocalDates(flight);
    expect(departureDate).toBe('2026-03-30');
    expect(arrivalDate).toBe('2026-03-31');
    expect(classifyFlightAgainstPageDate('2026-03-30', departureDate, arrivalDate)).toBe('departure');
    expect(classifyFlightAgainstPageDate('2026-03-31', departureDate, arrivalDate)).toBe('arrival');
  });

  it('cross-midnight flight, null airport timezone but offset present', () => {
    const flight = {
      departureTime: '2026-03-30T23:30:00+08:00',
      arrivalTime: '2026-03-31T01:30:00+08:00',
    };
    const { departureDate, arrivalDate } = getFlightLocalDates(flight);
    expect(departureDate).toBe('2026-03-30');
    expect(arrivalDate).toBe('2026-03-31');
    expect(classifyFlightAgainstPageDate('2026-03-30', departureDate, arrivalDate)).toBe('departure');
    expect(classifyFlightAgainstPageDate('2026-03-31', departureDate, arrivalDate)).toBe('arrival');
  });

  it('neither matches', () => {
    const flight = {
      departureTime: '2026-03-30T10:00:00+08:00',
      arrivalTime: '2026-03-30T13:00:00+08:00',
    };
    const { departureDate, arrivalDate } = getFlightLocalDates(flight);
    expect(classifyFlightAgainstPageDate('2026-03-29', departureDate, arrivalDate)).toBe('neither');
  });
});
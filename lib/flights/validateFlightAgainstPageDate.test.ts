import { describe, it, expect } from 'vitest';

function validateFlightAgainstPageDate({
  pageDate,
  departureLocalDate,
  arrivalLocalDate,
  mode,
}: {
  pageDate: string;
  departureLocalDate: string | null;
  arrivalLocalDate: string | null;
  mode: 'departure-day' | 'arrival-day' | 'either';
}): {
  accepted: boolean;
  matchesDepartureDate: boolean;
  matchesArrivalDate: boolean;
  rejectionReason?: string;
} {
  const matchesDepartureDate = pageDate === departureLocalDate;
  const matchesArrivalDate = pageDate === arrivalLocalDate;
  if (mode === 'departure-day') {
    if (matchesDepartureDate) return { accepted: true, matchesDepartureDate, matchesArrivalDate };
    return {
      accepted: false,
      matchesDepartureDate,
      matchesArrivalDate,
      rejectionReason: 'Flight does not depart on the selected day.'
    };
  }
  if (mode === 'arrival-day') {
    if (matchesArrivalDate) return { accepted: true, matchesDepartureDate, matchesArrivalDate };
    return {
      accepted: false,
      matchesDepartureDate,
      matchesArrivalDate,
      rejectionReason: 'Flight does not arrive on the selected day.'
    };
  }
  // 'either' mode
  if (matchesDepartureDate || matchesArrivalDate) return { accepted: true, matchesDepartureDate, matchesArrivalDate };
  return {
    accepted: false,
    matchesDepartureDate,
    matchesArrivalDate,
    rejectionReason: 'Flight does not depart or arrive on the selected day.'
  };
}

describe('validateFlightAgainstPageDate', () => {
  it('accepts same-day flight in departure-day mode', () => {
    const result = validateFlightAgainstPageDate({
      pageDate: '2026-03-30',
      departureLocalDate: '2026-03-30',
      arrivalLocalDate: '2026-03-30',
      mode: 'departure-day',
    });
    expect(result.accepted).toBe(true);
    expect(result.matchesDepartureDate).toBe(true);
    expect(result.matchesArrivalDate).toBe(true);
  });

  it('accepts cross-midnight flight in departure-day mode if departure matches', () => {
    const result = validateFlightAgainstPageDate({
      pageDate: '2026-03-30',
      departureLocalDate: '2026-03-30',
      arrivalLocalDate: '2026-03-31',
      mode: 'departure-day',
    });
    expect(result.accepted).toBe(true);
    expect(result.matchesDepartureDate).toBe(true);
    expect(result.matchesArrivalDate).toBe(false);
  });

  it('rejects cross-midnight flight in departure-day mode if only arrival matches', () => {
    const result = validateFlightAgainstPageDate({
      pageDate: '2026-03-31',
      departureLocalDate: '2026-03-30',
      arrivalLocalDate: '2026-03-31',
      mode: 'departure-day',
    });
    expect(result.accepted).toBe(false);
    expect(result.matchesDepartureDate).toBe(false);
    expect(result.matchesArrivalDate).toBe(true);
    expect(result.rejectionReason).toMatch('depart');
  });

  it('accepts cross-midnight flight in arrival-day mode if arrival matches', () => {
    const result = validateFlightAgainstPageDate({
      pageDate: '2026-03-31',
      departureLocalDate: '2026-03-30',
      arrivalLocalDate: '2026-03-31',
      mode: 'arrival-day',
    });
    expect(result.accepted).toBe(true);
    expect(result.matchesDepartureDate).toBe(false);
    expect(result.matchesArrivalDate).toBe(true);
  });

  it('rejects cross-midnight flight in arrival-day mode if only departure matches', () => {
    const result = validateFlightAgainstPageDate({
      pageDate: '2026-03-30',
      departureLocalDate: '2026-03-30',
      arrivalLocalDate: '2026-03-31',
      mode: 'arrival-day',
    });
    expect(result.accepted).toBe(false);
    expect(result.matchesDepartureDate).toBe(true);
    expect(result.matchesArrivalDate).toBe(false);
    expect(result.rejectionReason).toMatch('arrive');
  });

  it('accepts either in either mode', () => {
    const result = validateFlightAgainstPageDate({
      pageDate: '2026-03-31',
      departureLocalDate: '2026-03-30',
      arrivalLocalDate: '2026-03-31',
      mode: 'either',
    });
    expect(result.accepted).toBe(true);
    expect(result.matchesDepartureDate).toBe(false);
    expect(result.matchesArrivalDate).toBe(true);
  });
});

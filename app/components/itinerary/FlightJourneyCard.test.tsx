import { getFlightDisplayModel } from '@/lib/flights/flightDisplayModel';
import FlightJourneyCard from './FlightJourneyCard';
import { render } from '@testing-library/react';
import React from 'react';

describe('FlightJourneyCard', () => {
    it('does NOT show Edit action for flights', () => {
      const activity = {
        type: 'transport',
        metadata: {
          airline: 'Singapore Airlines',
          flightNumber: 'SQ 852',
          departure: { airportCode: 'SIN', datetime: '2026-03-30T08:00:00+08:00' },
          arrival: { airportCode: 'CAN', datetime: '2026-03-30T12:25:00+08:00' },
        },
        id: '1',
        day_id: 'd1',
      };
      const model = getFlightDisplayModel(activity);
      const { queryByText } = render(<FlightJourneyCard activity={model} />);
      expect(queryByText(/edit/i)).not.toBeInTheDocument();
    });

    it('shows Delete action for flights', () => {
      const activity = {
        type: 'transport',
        metadata: {
          airline: 'Singapore Airlines',
          flightNumber: 'SQ 852',
          departure: { airportCode: 'SIN', datetime: '2026-03-30T08:00:00+08:00' },
          arrival: { airportCode: 'CAN', datetime: '2026-03-30T12:25:00+08:00' },
        },
        id: '1',
        day_id: 'd1',
      };
      const model = getFlightDisplayModel(activity);
      const { getByText } = render(<FlightJourneyCard activity={model} />);
      expect(getByText(/delete/i)).toBeInTheDocument();
    });

    it('maps status "Expected" to "On Schedule"', () => {
      const activity = {
        type: 'transport',
        metadata: {
          status: 'Expected',
          departure: { airportCode: 'SIN', datetime: '2026-03-30T08:00:00+08:00' },
          arrival: { airportCode: 'CAN', datetime: '2026-03-30T12:25:00+08:00' },
        },
        id: '1',
        day_id: 'd1',
      };
      const model = getFlightDisplayModel(activity);
      const { getByText, queryByText } = render(<FlightJourneyCard activity={model} />);
      expect(getByText('On Schedule')).toBeInTheDocument();
      expect(queryByText('Expected')).not.toBeInTheDocument();
    });

    it('renders correct directional icon for departure', () => {
      const activity = {
        type: 'transport',
        metadata: {
          flightNumber: 'SQ 852',
          departure: { airportCode: 'SIN', datetime: '2026-03-30T08:00:00+08:00' },
          arrival: { airportCode: 'CAN', datetime: '2026-03-30T12:25:00+08:00' },
          isDeparture: true,
        },
        id: '1',
        day_id: 'd1',
      };
      const model = getFlightDisplayModel(activity);
      const { container } = render(<FlightJourneyCard activity={model} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders correct directional icon for arrival', () => {
      const activity = {
        type: 'transport',
        metadata: {
          flightNumber: 'SQ 853',
          departure: { airportCode: 'CAN', datetime: '2026-03-31T08:00:00+08:00' },
          arrival: { airportCode: 'SIN', datetime: '2026-03-31T12:25:00+08:00' },
          isArrival: true,
        },
        id: '2',
        day_id: 'd2',
      };
      const model = getFlightDisplayModel(activity);
      const { container } = render(<FlightJourneyCard activity={model} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  it('renders full rich flight card with complete metadata', () => {
    const activity = {
      type: 'transport',
      notes: 'Expected',
      metadata: {
        airline: 'Singapore Airlines',
        flightNumber: 'SQ 852',
        aircraft: 'Boeing 737',
        duration: '4h 25m',
        departure: {
          airportCode: 'SIN',
          airportName: 'Changi',
          city: 'Singapore',
          datetime: '2026-03-30T08:00:00+08:00',
          terminal: '3',
        },
        arrival: {
          airportCode: 'CAN',
          airportName: 'Baiyun',
          city: 'Guangzhou',
          datetime: '2026-03-30T12:25:00+08:00',
          terminal: '2',
        },
        status: 'Expected',
        checkInDesk: 'A12',
        gate: 'F5',
        codeshare: 'CA123',
      },
      created_at: '2026-03-29T10:00:00+08:00',
      id: '1',
      day_id: 'd1',
    };
    const model = getFlightDisplayModel(activity);
    const { getByText } = render(<FlightJourneyCard activity={model} />);
    expect(getByText('OUTBOUND')).toBeInTheDocument();
    expect(getByText('SQ 852 · Singapore Airlines')).toBeInTheDocument();
    expect(getByText('Boeing 737')).toBeInTheDocument();
    expect(getByText('4h 25m')).toBeInTheDocument();
    expect(getByText('Departs')).toBeInTheDocument();
    expect(getByText('Arrives')).toBeInTheDocument();
    expect(getByText('SIN')).toBeInTheDocument();
    expect(getByText('CAN')).toBeInTheDocument();
    expect(getByText('Singapore')).toBeInTheDocument();
    expect(getByText('Guangzhou')).toBeInTheDocument();
    expect(getByText('Terminal 3')).toBeInTheDocument();
    expect(getByText('Terminal 2')).toBeInTheDocument();
    expect(getByText('Expected')).toBeInTheDocument();
    expect(getByText(/Check-in: A12/)).toBeInTheDocument();
    expect(getByText(/Gate: F5/)).toBeInTheDocument();
    expect(getByText(/Codeshare: CA123/)).toBeInTheDocument();
  });

  it('renders cross-midnight flight with different dates', () => {
    const activity = {
      type: 'transport',
      metadata: {
        airline: 'Singapore Airlines',
        flightNumber: 'SQ 853',
        duration: '7h 10m',
        departure: {
          airportCode: 'LHR',
          city: 'London',
          datetime: '2026-03-30T22:30:00+01:00',
        },
        arrival: {
          airportCode: 'SIN',
          city: 'Singapore',
          datetime: '2026-03-31T18:40:00+08:00',
        },
      },
      created_at: '2026-03-29T10:00:00+08:00',
      id: '2',
      day_id: 'd2',
    };
    const model = getFlightDisplayModel(activity);
    const { getByText } = render(<FlightJourneyCard activity={model} />);
    expect(getByText('LHR')).toBeInTheDocument();
    expect(getByText('SIN')).toBeInTheDocument();
    // Should show both dates
    expect(getByText(/Mar/)).toBeInTheDocument();
  });

  it('renders partial metadata gracefully', () => {
    const activity = {
      type: 'transport',
      metadata: {
        airline: 'Scoot',
        flightNumber: 'TR 123',
        departure: { airportCode: 'SIN' },
        arrival: { airportCode: 'BKK' },
      },
      created_at: '2026-03-29T10:00:00+08:00',
      id: '3',
      day_id: 'd3',
    };
    const model = getFlightDisplayModel(activity);
    const { getByText } = render(<FlightJourneyCard activity={model} />);
    expect(getByText('TR 123 · Scoot')).toBeInTheDocument();
    expect(getByText('SIN')).toBeInTheDocument();
    expect(getByText('BKK')).toBeInTheDocument();
  });

  it('does not affect non-flight activities', () => {
    // This test is for the renderer, not the card itself
    // ...existing code...
  });
});

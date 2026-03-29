import React from 'react';
import type { FlightActivity } from '@/lib/trips/flight-activity';

interface FlightJourneyCardProps {
  activity: FlightActivity;
}

export const FlightJourneyCard: React.FC<FlightJourneyCardProps> = ({ activity }) => {
  const { airline, flightNumber, carrierCode, departure, arrival, duration, aircraft, notes } = activity;

  // Helper to format date/time
  const formatDateTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Check if arrival is next day
  const isNextDay = () => {
    if (!departure.datetime || !arrival.datetime) return false;
    const dep = new Date(departure.datetime);
    const arr = new Date(arrival.datetime);
    return arr.getDate() !== dep.getDate() || arr.getTime() - dep.getTime() > 24 * 3600 * 1000;
  };

  return (
    <div className="flight-journey-card">
      <div className="flight-journey-card__top">
        <span className="flight-journey-card__airline">{airline} {flightNumber}</span>
        {duration && <span className="flight-journey-card__duration">{duration}</span>}
        {aircraft && <span className="flight-journey-card__aircraft">{aircraft}</span>}
      </div>
      <div className="flight-journey-card__main">
        <div className="flight-journey-card__side flight-journey-card__side--left">
          <div className="flight-journey-card__label">Depart</div>
          <div className="flight-journey-card__airport">{departure.airportCode}</div>
          <div className="flight-journey-card__city">{departure.city || departure.airportName}</div>
          <div className="flight-journey-card__datetime">{formatDateTime(departure.datetime)}</div>
          {departure.terminal && <div className="flight-journey-card__terminal">Terminal {departure.terminal}</div>}
        </div>
        <div className="flight-journey-card__connector">
          <span className="flight-journey-card__arrow">→</span>
          {isNextDay() && <span className="flight-journey-card__nextday">+1 day</span>}
        </div>
        <div className="flight-journey-card__side flight-journey-card__side--right">
          <div className="flight-journey-card__label">Arrive</div>
          <div className="flight-journey-card__airport">{arrival.airportCode}</div>
          <div className="flight-journey-card__city">{arrival.city || arrival.airportName}</div>
          <div className="flight-journey-card__datetime">{formatDateTime(arrival.datetime)}</div>
          {arrival.terminal && <div className="flight-journey-card__terminal">Terminal {arrival.terminal}</div>}
        </div>
      </div>
      {notes && <div className="flight-journey-card__notes">{notes}</div>}
      <div className="flight-journey-card__actions">
        {/* TODO: Add edit/replace/delete actions */}
      </div>
    </div>
  );
};

export default FlightJourneyCard;

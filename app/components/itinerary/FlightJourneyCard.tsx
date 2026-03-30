"use client";
import React from 'react';
import styles from './FlightJourneyCard.module.css';
import Card from '../../../app/components/ui/Card';
import { PlaneChip } from './PlaneIcon';



interface FlightJourneyCardProps {
  activity: any;
  onDelete?: (id: string) => void;
}


function isFlightActivity(activity: any): boolean {
  if (!activity) return false;
  const meta = activity.metadata || activity._meta || {};
  return !!(
    meta.flightNumber || meta.airline || meta.departure || meta.arrival
  );
}

function canEditActivity(activity: any) {
  return !isFlightActivity(activity);
}
function canDeleteActivity(activity: any) {
  return true;
}


function formatFlightStatusForDisplay(status?: string) {
  if (!status) return '';
  if (status.trim().toLowerCase() === 'expected') return 'On Schedule';
  return status;
}

// Directional icon helpers
function getFlightDirection(activity: any): 'departure' | 'arrival' | 'unknown' {
  const meta = activity.metadata || activity._meta || {};
  if (!meta.departure || !meta.arrival) return 'unknown';
  // If current day matches departure day, it's a departure; if arrival, arrival
  // Fallback: if we have both, prefer departure
  if (meta.isDeparture) return 'departure';
  if (meta.isArrival) return 'arrival';
  return 'departure';
}


// PlaneChip is now the only icon used for flights (emoji-style)

function formatDateTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function getDirectionLabel(activity: any): string {
  // Try to infer OUTBOUND/INBOUND/FLIGHT from metadata or fallback
  if (activity._meta?.direction) return activity._meta.direction.toUpperCase();
  if (activity._meta?.isInbound) return activity._meta.isInbound ? 'INBOUND' : 'OUTBOUND';
  return 'FLIGHT';
}


const FlightJourneyCard: React.FC<FlightJourneyCardProps> = ({ activity, onDelete }) => {
  const {
    airline,
    flightNumber,
    aircraft,
    duration,
    departure = {},
    arrival = {},
    notes,
    _meta = {},
    status,
  } = activity;

  // Secondary details
  const secondary: string[] = [];
  if (_meta.checkInDesk) secondary.push(`Check-in: ${_meta.checkInDesk}`);
  if (_meta.gate) secondary.push(`Gate: ${_meta.gate}`);
  import { isFlightActivity } from '@/lib/flights/isFlightActivity';
    headerTitle = `Flight · ${airline}`;
  } else {
    headerTitle = activity.title || 'Flight';
  }

  return (
    <Card className={styles.flightCard}>
      <div className={styles.topRow}>
        <span className={styles.chipIcon}><PlaneChip /></span>
        <span className={styles.title}>{headerTitle}</span>
        {aircraft && <span className={styles.aircraft}>{aircraft}</span>}
        {duration && <span className={styles.durationPill}>{duration}</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.block}>
          <div className={styles.label}>Departs</div>
          <div className={styles.airportCode}>{departure.airportCode || '-'}</div>
          <div className={styles.city}>{origin}</div>
          <div>{formatDateTime(departure.datetime)}</div>
          {departure.terminal && (
            <div className={styles.terminal}>Terminal {departure.terminal}</div>
          )}
        </div>
        <div className={styles.block}>
          <div className={styles.label}>Arrives</div>
          <div className={styles.airportCode}>{arrival.airportCode || '-'}</div>
          <div className={styles.city}>{destination}</div>
          <div>{formatDateTime(arrival.datetime)}</div>
          {arrival.terminal && (
            <div className={styles.terminal}>Terminal {arrival.terminal}</div>
          )}
        </div>
      </div>
      {(notes || secondary.length > 0) && (
        <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
          {notes && <div>{formatFlightStatusForDisplay(notes)}</div>}
          {secondary.length > 0 && (
            <div style={{ opacity: 0.8, marginTop: 2 }}>{secondary.join(' · ')}</div>
          )}
        </div>
      )}
      {/* Actions: Only Delete for flights */}
      {canDeleteActivity(activity) && onDelete && (
        <div className={styles.actionsRow}>
          <button
            className={styles.deleteButton}
            onClick={() => onDelete(activity.id)}
            aria-label="Delete Flight Activity"
          >
            Delete
          </button>
        </div>
      )}
    </Card>
  );
};

export default FlightJourneyCard;

import React from 'react';
import styles from './FlightJourneyCard.module.css';
import { PlaneIcon } from './PlaneIcon';


interface FlightJourneyCardProps {
  activity: any;
  onDelete?: (id: string) => void;
}

function canEditActivity(activity: any) {
  // Flights: cannot edit
  return false;
}
function canDeleteActivity(activity: any) {
  // Flights: can delete
  return true;
}

function formatFlightStatusForDisplay(status?: string) {
  if (!status) return '';
  if (status.trim().toLowerCase() === 'expected') return 'On Schedule';
  return status;
}

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
    departure,
    arrival,
    notes,
    _meta,
    _raw,
    type,
    status,
    // secondary details
    rawMetadata,
  } = activity;


  // Secondary details
  const secondary: string[] = [];
  if (_meta?.checkInDesk) secondary.push(`Check-in: ${_meta.checkInDesk}`);
  if (_meta?.gate) secondary.push(`Gate: ${_meta.gate}`);
  if (_meta?.codeshare) secondary.push(`Codeshare: ${_meta.codeshare}`);
  if (_meta?.status && !notes) secondary.push(formatFlightStatusForDisplay(_meta.status));

  return (
    <div className={styles.flightCard}>
      <div className={styles.topRow}>
        <span className={styles.directionLabel}>
          <PlaneIcon size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {getDirectionLabel(activity)}
        </span>
        <span className={styles.title}>
          {flightNumber ? (
            <>{airline ? `${flightNumber} · ${airline}` : flightNumber}</>
          ) : (
            airline
          )}
        </span>
        {aircraft && <span className={styles.aircraft}>{aircraft}</span>}
        {duration && <span className={styles.durationPill}>{duration}</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.block}>
          <div className={styles.label}>Departs</div>
          <div className={styles.airportCode}>{departure.airportCode || '-'}</div>
          <div className={styles.city}>{departure.city || departure.airportName || ''}</div>
          <div>{formatDateTime(departure.datetime)}</div>
          {departure.terminal && (
            <div className={styles.terminal}>Terminal {departure.terminal}</div>
          )}
        </div>
        <div className={styles.block}>
          <div className={styles.label}>Arrives</div>
          <div className={styles.airportCode}>{arrival.airportCode || '-'}</div>
          <div className={styles.city}>{arrival.city || arrival.airportName || ''}</div>
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
    </div>
  );
};

export default FlightJourneyCard;

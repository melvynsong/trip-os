"use client";


import { useState } from 'react';
import { MeetUpInput } from '../../../lib/meet-up/types';
import { Typography } from '../../components/design-system/Typography';

const THEMES = [
  'Japanese',
  'Local',
  'Peranakan',
  'Western',
  'Vegetarian',
  'Potluck',
  'No preference',
];

type Props = {
  onPlan: (input: MeetUpInput) => void;
  loading: boolean;
};

export default function EventForm({ onPlan, loading }: Props) {
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [host, setHost] = useState('');
  const [pax, setPax] = useState<number>(6);
  const [theme, setTheme] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlan({
      eventName: eventName.trim(),
      date,
      time,
      location: location.trim(),
      host: host.trim(),
      pax: Math.max(2, Math.min(30, pax)),
      theme: theme || 'No preference',
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-8 space-y-4">
      <Typography as="h2" variant="sectionTitle" className="mb-2 text-[color:var(--brand-primary)] text-left">
        Event Details
      </Typography>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Typography as="label" variant="label" className="block mb-1 text-left">Event Name</Typography>
          <input
            className="input"
            type="text"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            required
            placeholder="E.g. Sakura Dinner"
            maxLength={40}
          />
        </div>
        <div className="flex-1">
          <Typography as="label" variant="label" className="block mb-1 text-left">Host</Typography>
          <input
            className="input"
            type="text"
            value={host}
            onChange={e => setHost(e.target.value)}
            placeholder="E.g. Aiko"
            maxLength={24}
          />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Typography as="label" variant="label" className="block mb-1 text-left">Date</Typography>
          <input
            className="input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <Typography as="label" variant="label" className="block mb-1 text-left">Time</Typography>
          <input
            className="input"
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <Typography as="label" variant="label" className="block mb-1 text-left">Pax</Typography>
          <input
            className="input"
            type="number"
            min={2}
            max={30}
            value={pax}
            onChange={e => setPax(Number(e.target.value))}
            required
          />
        </div>
      </div>
      <div>
        <Typography as="label" variant="label" className="block mb-1 text-left">Location</Typography>
        <input
          className="input"
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="E.g. 123 Orchard Road"
          maxLength={60}
        />
      </div>
      <div>
        <Typography as="label" variant="label" className="block mb-1 text-left">Theme</Typography>
        <select
          className="input"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          <option value="">Select theme</option>
          {THEMES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <Typography as="label" variant="label" className="block mb-1 text-left">Notes</Typography>
        <textarea
          className="input"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="E.g. Please bring your favorite drink!"
          maxLength={120}
        />
      </div>
      <button
        type="submit"
        className="btn w-full bg-[color:var(--brand-primary)] text-white hover:bg-[color:var(--brand-primary-hover)] font-semibold py-2 rounded transition mt-2"
        disabled={loading}
      >
        {loading ? 'Planning...' : 'Generate Plan'}
      </button>
    </form>
  );
}

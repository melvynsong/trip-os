"use client";


import { useState } from 'react';
import { MeetUpInput } from '../../../lib/meet-up/types';
import { Typography } from '../../components/design-system/Typography';



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
  // Theme is now part of notes, no dropdown
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
      theme: '', // theme is now part of notes
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/90 rounded-2xl shadow-xl p-8 max-w-xl mx-auto space-y-6">
      <Typography as="h2" variant="sectionTitle" className="mb-2 text-[color:var(--brand-primary)] text-left">
        Tell us about your gathering
      </Typography>
      <div className="flex flex-col gap-4">
        <input
          className="input text-lg px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)]"
          type="text"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
          required
          placeholder="What’s the occasion? (e.g. Sakura Dinner)"
          maxLength={40}
        />
        <div className="flex gap-4">
          <input
            className="input flex-1 px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)]"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <input
            className="input flex-1 px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)]"
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
          />
          <input
            className="input flex-1 px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)]"
            type="number"
            min={2}
            max={30}
            value={pax}
            onChange={e => setPax(Number(e.target.value))}
            required
            placeholder="Pax"
          />
        </div>
        <input
          className="input text-lg px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)]"
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Where? (e.g. 123 Orchard Road)"
          maxLength={60}
        />
        <input
          className="input text-lg px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)]"
          type="text"
          value={host}
          onChange={e => setHost(e.target.value)}
          placeholder="Who’s hosting? (e.g. Aiko)"
          maxLength={24}
        />
        <div>
          <Typography as="label" variant="label" className="block mb-1 text-left">
            Theme preference / host notes
          </Typography>
          <textarea
            className="input w-full px-4 py-3 rounded-lg border border-[color:var(--brand-primary-soft)] focus:border-[color:var(--brand-primary)] min-h-[80px] text-base"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={`E.g.\n- Warm comfort food for rainy evening\n- Japanese potluck, light and simple\n- Family dinner, mix of spicy and non-spicy`}
            maxLength={120}
          />
        </div>
      </div>
      <button
        type="submit"
        className="btn w-full bg-[color:var(--brand-primary)] text-white hover:bg-[color:var(--brand-primary-hover)] font-semibold py-3 rounded-full transition mt-2 text-lg"
        disabled={loading}
      >
        {loading ? 'Planning...' : 'Generate Plan'}
      </button>
    </form>
  );
}

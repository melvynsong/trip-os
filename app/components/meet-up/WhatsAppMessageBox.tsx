"use client";


import { useState } from 'react';
import { MeetUpInput, MeetUpPlan } from '../../../lib/meet-up/types';
import { buildWhatsAppMessage } from '../../../lib/meet-up/whatsapp-message';
import { Typography } from '../../design-system/Typography';

type Props = { input: MeetUpInput; plan: MeetUpPlan };

export default function WhatsAppMessageBox({ input, plan }: Props) {
  const [message, setMessage] = useState(buildWhatsAppMessage(input, plan));
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <Typography as="h2" variant="sectionTitle" className="mb-2 text-[color:var(--brand-primary)]">
        WhatsApp Message
      </Typography>
      <textarea
        className="input w-full h-32 mb-2"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button
        className="btn w-full bg-[color:var(--brand-primary)] text-white hover:bg-[color:var(--brand-primary-hover)] font-semibold py-2 rounded transition"
        onClick={handleCopy}
        type="button"
      >
        {copied ? 'Copied!' : 'Copy to WhatsApp'}
      </button>
    </div>
  );
}

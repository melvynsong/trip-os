"use client";

import { useState } from 'react';
import { MeetUpInput, MeetUpPlan } from '../../../lib/meet-up/types';
import { buildWhatsAppMessage } from '../../../lib/meet-up/whatsapp-message';

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
    <section className="bg-card p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-semibold mb-2 text-primary">WhatsApp Message</h2>
      <textarea
        className="input w-full h-32 mb-2"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button
        className="btn btn-success w-full"
        onClick={handleCopy}
        type="button"
      >
        {copied ? 'Copied!' : 'Copy to WhatsApp'}
      </button>
    </section>
  );
}

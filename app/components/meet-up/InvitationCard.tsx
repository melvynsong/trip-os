
import { MeetUpInput, MeetUpPlan } from '../../../lib/meet-up/types';
import { Typography } from '../../components/design-system/Typography';
import dynamic from 'next/dynamic';

const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false });

type Props = { input: MeetUpInput; plan: MeetUpPlan };

export default function InvitationCard({ input, plan }: Props) {
  return (
    <div className="relative bg-white/90 backdrop-blur border-2 border-[color:var(--brand-primary)] rounded-2xl shadow-2xl mx-auto max-w-lg p-10 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[color:var(--brand-primary-soft)] via-white/60 to-transparent opacity-80 rounded-2xl" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Typography as="h2" variant="sectionTitle" className="mb-1 text-[color:var(--brand-primary)] text-2xl md:text-3xl font-bold tracking-tight">
          {input.eventName || 'Meet-Up'}
        </Typography>
        <Typography as="div" variant="cardSubtitle" className="mb-2 text-lg md:text-xl text-slate-700">
          {plan.theme ? `${plan.theme} Dinner` : 'Dinner Gathering'}
        </Typography>
        <div className="flex flex-col md:flex-row justify-center gap-4 w-full mb-2">
          <div className="flex-1 text-left md:text-center">
            <span className="font-semibold">Date:</span> {input.date || 'TBA'}
          </div>
          <div className="flex-1 text-left md:text-center">
            <span className="font-semibold">Time:</span> {input.time || 'TBA'}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-center gap-4 w-full mb-2">
          <div className="flex-1 text-left md:text-center">
            <span className="font-semibold">Location:</span> {input.location || 'TBA'}
          </div>
          <div className="flex-1 text-left md:text-center">
            <span className="font-semibold">Host:</span> {input.host || 'TBA'}
          </div>
          <div className="flex-1 text-left md:text-center">
            <span className="font-semibold">Pax:</span> {input.pax}
          </div>
        </div>
        {input.location && (
          <div className="w-full flex justify-center my-2">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md w-full max-w-xs">
              <MapPreview location={input.location} />
            </div>
          </div>
        )}
        {input.notes && (
          <Typography as="div" variant="helper" className="mt-2 italic text-muted-foreground text-base">
            {input.notes}
          </Typography>
        )}
      </div>
    </div>
  );
}

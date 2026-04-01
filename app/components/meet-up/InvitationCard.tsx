import { MeetUpInput, MeetUpPlan } from '../../../lib/meet-up/types';
import { Typography } from '../../components/design-system/Typography';

type Props = { input: MeetUpInput; plan: MeetUpPlan };

export default function InvitationCard({ input, plan }: Props) {
  return (
    <div className="relative bg-white/80 backdrop-blur border-2 border-[color:var(--brand-primary)] rounded-2xl shadow-xl mx-auto max-w-lg p-8 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[color:var(--brand-primary-soft)] via-white/60 to-transparent opacity-80 rounded-2xl" />
      <div className="relative z-10">
      <Typography as="h2" variant="sectionTitle" className="mb-2 text-[color:var(--brand-primary)]">
        {input.eventName || 'Meet-Up'}
      </Typography>
      <Typography as="div" variant="cardSubtitle" className="mb-1 text-lg">
        {plan.theme} Dinner
      </Typography>
      <div className="mb-1">
        <span className="font-medium">Date:</span> {input.date} &nbsp;
        <span className="font-medium">Time:</span> {input.time}
      </div>
      <div className="mb-1">
        <span className="font-medium">Location:</span> {input.location || 'TBA'}
      </div>
      <div className="mb-1">
        <span className="font-medium">Host:</span> {input.host || 'TBA'}
      </div>
      <div className="mb-1">
        <span className="font-medium">Pax:</span> {input.pax}
      </div>
      {input.notes && (
        <Typography as="div" variant="helper" className="mt-2 italic text-muted-foreground">
          {input.notes}
        </Typography>
      )}
      </div>
    </div>
    </div>
  );
}

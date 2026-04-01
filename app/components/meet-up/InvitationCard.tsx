import { MeetUpInput, MeetUpPlan } from '../../../lib/meet-up/types';

type Props = { input: MeetUpInput; plan: MeetUpPlan };

export default function InvitationCard({ input, plan }: Props) {
  return (
    <section className="bg-gradient-to-br from-yellow-50 to-pink-50 border border-yellow-200 rounded-xl shadow mb-6 p-6 text-center">
      <h2 className="text-2xl font-bold text-primary mb-2">{input.eventName || 'Meet-Up'}</h2>
      <div className="mb-1 text-lg">{plan.theme} Dinner</div>
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
        <div className="mt-2 italic text-muted-foreground">{input.notes}</div>
      )}
    </section>
  );
}

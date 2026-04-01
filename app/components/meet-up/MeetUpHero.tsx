import { Typography } from '../../components/design-system/Typography';
import { SectionContainer } from '../../components/design-system/SectionContainer';

export default function MeetUpHero() {
  return (
    <section className="text-center py-16 md:py-24">
      <div className="mb-3">
        <span className="uppercase tracking-widest text-xs font-bold text-[color:var(--brand-primary)] bg-white/60 rounded px-3 py-1 shadow">
          MEET-UP PLANNER
        </span>
      </div>
      <Typography as="h1" variant="pageTitle" className="mb-4 text-white drop-shadow-lg text-4xl md:text-5xl font-serif">
        Gather. Celebrate. Connect.
      </Typography>
      <Typography as="p" variant="cardSubtitle" className="mb-6 text-lg text-white/90 max-w-xl mx-auto">
        Plan unforgettable dinners and gatherings with a beautiful, free invitation and seamless WhatsApp sharing.
      </Typography>
      <button
        className="btn bg-white text-[color:var(--brand-primary)] font-bold px-8 py-3 rounded-full shadow-lg hover:bg-[color:var(--brand-primary-soft)] transition text-lg"
        onClick={onStart}
      >
        Start Planning
      </button>
      <div className="mt-6 flex justify-center">
        <span className="inline-block bg-white/80 text-[color:var(--brand-primary)] rounded-full px-4 py-1 text-sm font-semibold shadow">
          Free &amp; No Login Required
        </span>
      </div>
    </section>
  );
  );
}

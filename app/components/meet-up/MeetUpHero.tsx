import { Typography } from '../../design-system/Typography';
import { SectionContainer } from '../../design-system/SectionContainer';

export default function MeetUpHero() {
  return (
    <SectionContainer className="text-center">
      <Typography as="h1" variant="pageTitle" className="mb-2 text-[color:var(--brand-primary)]">
        Plan a Memorable Meet-Up
      </Typography>
      <Typography as="p" variant="cardSubtitle" className="mb-4">
        Effortlessly coordinate your next dinner or gathering with ToGoStory’s premium planner.
      </Typography>
      <div className="flex justify-center">
        <span className="inline-block bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)] rounded-full px-3 py-1 text-sm font-semibold">
          Free &amp; No Login Required
        </span>
      </div>
    </SectionContainer>
  );
}

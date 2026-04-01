import { Typography } from '../../components/design-system/Typography';

const steps = [
  {
    title: 'Plan your event',
    desc: 'Enter your event details and preferences.',
    icon: '📝',
  },
  {
    title: 'Create invitation card',
    desc: 'Preview and personalize a beautiful invitation.',
    icon: '💌',
  },
  {
    title: 'Send WhatsApp message',
    desc: 'Copy and share your invite instantly.',
    icon: '📱',
  },
];

export default function ExplainerSteps() {
  return (
    <div className="flex flex-col md:flex-row justify-center gap-8 mt-6 mb-8">
      {steps.map((step, i) => (
        <div
          key={step.title}
          className="flex-1 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center min-w-[220px] max-w-xs mx-auto transition-transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer border border-transparent hover:border-[color:var(--brand-primary)] group"
        >
          <div className="text-5xl mb-3 drop-shadow-sm group-hover:scale-110 transition-transform">{step.icon}</div>
          <Typography as="div" variant="sectionTitle" className="mb-2 text-[color:var(--brand-primary)] text-lg md:text-xl">
            {`Step ${i + 1}: ${step.title}`}
          </Typography>
          <Typography as="div" variant="cardSubtitle" className="text-slate-600 text-base md:text-lg">
            {step.desc}
          </Typography>
        </div>
      ))}
    </div>
  );
}

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
    <div className="flex flex-col md:flex-row justify-center gap-6">
      {steps.map((step, i) => (
        <div
          key={step.title}
          className="flex-1 bg-white/70 backdrop-blur rounded-xl shadow-lg p-6 text-center min-w-[200px] max-w-xs mx-auto"
        >
          <div className="text-3xl mb-2">{step.icon}</div>
          <Typography as="div" variant="sectionTitle" className="mb-1 text-[color:var(--brand-primary)]">
            {`Step ${i + 1}: ${step.title}`}
          </Typography>
          <Typography as="div" variant="cardSubtitle" className="text-slate-600">
            {step.desc}
          </Typography>
        </div>
      ))}
    </div>
  );
}

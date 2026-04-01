import { MeetUpPlan } from '../../../lib/meet-up/types';
import { Typography } from '../../components/design-system/Typography';

type Props = { plan: MeetUpPlan };

export default function FoodPlanSummary({ plan }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <Typography as="h2" variant="sectionTitle" className="mb-2 text-[color:var(--brand-primary)]">
        Dinner Plan
      </Typography>
      <ul className="space-y-1 mb-2">
        <li>
          <span className="font-medium">Theme:</span> {plan.theme}
        </li>
        <li>
          <span className="font-medium">Mains:</span> {plan.mains}
        </li>
        <li>
          <span className="font-medium">Carbs:</span> {plan.carbs}
        </li>
        <li>
          <span className="font-medium">Vegetables:</span> {plan.vegetables}
        </li>
        <li>
          <span className="font-medium">Sides:</span> {plan.sides}
        </li>
        <li>
          <span className="font-medium">Desserts:</span> {plan.desserts}
        </li>
        <li>
          <span className="font-medium">Drinks:</span> {plan.drinks}
        </li>
      </ul>
      <Typography as="div" variant="helper" className="text-muted-foreground text-sm">
        {plan.notes}
      </Typography>
    </div>
  );
}

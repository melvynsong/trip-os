import { MeetUpPlan } from '../../../lib/meet-up/types';

type Props = { plan: MeetUpPlan };

export default function FoodPlanSummary({ plan }: Props) {
  return (
    <section className="bg-card p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-semibold mb-2 text-primary">Dinner Plan</h2>
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
      <div className="text-muted-foreground text-sm">{plan.notes}</div>
    </section>
  );
}

import { MeetUpInput, MeetUpPlan } from './types';

export function buildWhatsAppMessage(input: MeetUpInput, plan: MeetUpPlan): string {
  return [
    `🍽️ *${input.eventName || 'Meet-Up'}*`,
    `Host: ${input.host || 'TBA'}`,
    `Date: ${input.date}  Time: ${input.time}`,
    `Location: ${input.location || 'TBA'}`,
    `Pax: ${input.pax}`,
    `Theme: ${plan.theme}`,
    '',
    `*Dinner Plan*`,
    `Mains: ${plan.mains}`,
    `Carbs: ${plan.carbs}`,
    `Vegetables: ${plan.vegetables}`,
    `Sides: ${plan.sides}`,
    `Desserts: ${plan.desserts}`,
    `Drinks: ${plan.drinks}`,
    '',
    plan.notes,
    '',
    'Let me know if you have any questions or requests!',
  ].join('\n');
}

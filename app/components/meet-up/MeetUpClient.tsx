"use client";


import { useState } from 'react';
import MeetUpHero from './MeetUpHero';
import EventForm from './EventForm';
import FoodPlanSummary from './FoodPlanSummary';
import InvitationCard from './InvitationCard';
import WhatsAppMessageBox from './WhatsAppMessageBox';
import MeetUpError from './MeetUpError';
import MeetUpLoading from './MeetUpLoading';
import { MeetUpInput, MeetUpPlan } from '../../../lib/meet-up/types';
import { PageContainer } from '../../components/design-system/PageContainer';
import { CardContainer } from '../../components/design-system/CardContainer';

export default function MeetUpClient() {
  const [input, setInput] = useState<MeetUpInput | null>(null);
  const [plan, setPlan] = useState<MeetUpPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlan = async (formInput: MeetUpInput) => {
    setInput(formInput);
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch('/api/meet-up/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInput),
      });
      if (!res.ok) throw new Error('Failed to generate plan');
      const data = await res.json();
      setPlan(data.plan);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="py-8">
      <MeetUpHero />
      <CardContainer>
        <EventForm onPlan={handlePlan} loading={loading} />
        {loading && <MeetUpLoading />}
        {error && <MeetUpError message={error} />}
        {plan && (
          <>
            <FoodPlanSummary plan={plan} />
            <InvitationCard input={input!} plan={plan} />
            <WhatsAppMessageBox input={input!} plan={plan} />
          </>
        )}
      </CardContainer>
    </PageContainer>
  );
}

"use client";



import { useRef, useState } from 'react';
import MeetUpHero from './MeetUpHero';
import ExplainerSteps from './ExplainerSteps';
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
  const formRef = useRef<HTMLDivElement>(null);

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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="gradient-bg min-h-screen pb-16">
      <PageContainer>
        <MeetUpHero onStart={scrollToForm} />
        <div className="my-10">
          <ExplainerSteps />
        </div>
        <div ref={formRef} className="my-12">
          <EventForm onPlan={handlePlan} loading={loading} />
        </div>
        {loading && <MeetUpLoading />}
        {error && <MeetUpError message={error} />}
        {plan && (
          <div className="flex flex-col gap-10 mt-16">
            <InvitationCard input={input!} plan={plan} />
            <FoodPlanSummary plan={plan} />
            <WhatsAppMessageBox input={input!} plan={plan} />
          </div>
        )}
      </PageContainer>
    </div>
  );
}

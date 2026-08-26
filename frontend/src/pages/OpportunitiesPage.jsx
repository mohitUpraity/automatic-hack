import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Sparkles, Briefcase, Zap } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import OpportunityFeed from '../components/opportunities/OpportunityFeed';

export default function OpportunitiesPage() {
  const [searchParams] = useSearchParams();
  const initialCandId = searchParams.get('candidateId') || 'candidate_all';

  return (
    <PageShell
      title="Career & Opportunity Scout Feed"
      subtitle="Real-time AI job discovery, Firecrawl deep company intelligence & ATS resume tailoring"
      icon={Compass}
    >
      <div className="space-y-6 animate-fade-in">
        <OpportunityFeed initialCandidateId={initialCandId} />
      </div>
    </PageShell>
  );
}

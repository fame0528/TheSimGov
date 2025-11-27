'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TalentMarketplace, AICandidate, JobOffer } from '@/lib/components/ai/TalentMarketplace';

// NOTE: Phase 3 Talent Page
// Mounts TalentMarketplace with sample AI candidates and offer submission handler.
// Real implementation would fetch from backend talent/recruitment endpoints.

export default function AITalentPage() {
  const router = useRouter();

  // Sample AI talent candidates for demonstration
  const [candidates, setCandidates] = useState<AICandidate[]>([
    {
      id: 'candidate-1',
      name: 'Dr. Sarah Chen',
      role: 'ResearchScientist',
      tier: 'PhD',
      university: 'Stanford',
      publications: 24,
      hIndex: 12,
      expertise: ['Transformer Architecture', 'Computer Vision', 'Neural Search'],
      skills: { research: 9, coding: 8, technical: 92, analytical: 95 },
      expectedSalary: 350000,
      interestLevel: 85,
    },
    {
      id: 'candidate-2',
      name: 'Alex Rodriguez',
      role: 'MLEngineer',
      tier: 'Senior',
      expertise: ['LLM Training', 'Distributed Computing', 'Model Optimization'],
      skills: { research: 7, coding: 9, technical: 88, analytical: 82 },
      expectedSalary: 280000,
      interestLevel: 72,
    },
    {
      id: 'candidate-3',
      name: 'Dr. Priya Patel',
      role: 'ResearchScientist',
      tier: 'PhD',
      university: 'MIT',
      publications: 18,
      hIndex: 9,
      expertise: ['Reinforcement Learning', 'Multi-Agent Systems', 'Game Theory'],
      skills: { research: 10, coding: 7, technical: 90, analytical: 93 },
      expectedSalary: 320000,
      interestLevel: 68,
    },
    {
      id: 'candidate-4',
      name: 'Michael Zhang',
      role: 'MLOps',
      tier: 'Senior',
      expertise: ['Kubernetes', 'ML Pipelines', 'Infrastructure Automation'],
      skills: { research: 5, coding: 9, technical: 85, analytical: 78 },
      expectedSalary: 220000,
      interestLevel: 90,
    },
    {
      id: 'candidate-5',
      name: 'Jessica Williams',
      role: 'MLEngineer',
      tier: 'Mid',
      expertise: ['PyTorch', 'Model Deployment', 'API Development'],
      skills: { research: 6, coding: 8, technical: 75, analytical: 72 },
      expectedSalary: 180000,
      interestLevel: 80,
    },
    {
      id: 'candidate-6',
      name: 'David Kim',
      role: 'DataEngineer',
      tier: 'Senior',
      expertise: ['Data Pipelines', 'ETL', 'Big Data Processing'],
      skills: { research: 4, coding: 9, technical: 82, analytical: 80 },
      expectedSalary: 210000,
      interestLevel: 65,
    },
  ]);

  const handleMakeOffer = async (candidateId: string, offer: JobOffer) => {
    // Placeholder: Real implementation would POST to backend recruitment endpoint
    console.log('Making offer to candidate:', candidateId, offer);
    // Simulate backend processing
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="p-6">
      <TalentMarketplace
        companyId="demo-company"
        candidates={candidates}
        onMakeOffer={handleMakeOffer}
      />
    </div>
  );
}

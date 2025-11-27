'use client';

import { useRouter } from 'next/navigation';
import { AICompanyDashboard, ActivityEvent } from '@/lib/components/ai/AICompanyDashboard';

// NOTE: Phase 1 Overview Page
// Minimal wrapper that mounts the AICompanyDashboard component.
// Real data wiring (fetching KPIs & activity) can be added once backend endpoints are confirmed.

export default function AIOverviewPage() {
  const router = useRouter();

  // Placeholder KPI + activity data to exercise component rendering.
  const totalModels = 3;
  const activeResearch = 2;
  const gpuUtilization = 67.4;
  const monthlyRevenue = 125000; // USD

  const recentActivity: ActivityEvent[] = [
    {
      id: 'evt-1',
      type: 'deployment',
      title: 'Model v1.4 Deployed',
      description: 'Latency improved by 12%',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30m ago
      impact: 'medium',
    },
    {
      id: 'evt-2',
      type: 'research',
      title: 'New Project: Vision Transformer',
      description: 'Initiated multimodal architecture exploration',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5h ago
      impact: 'high',
    },
    {
      id: 'evt-3',
      type: 'breakthrough',
      title: 'Data Efficiency Gain',
      description: 'Achieved 8% lower token usage per inference',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5h ago
      impact: 'high',
    },
  ];

  return (
    <div className="p-6">
      <AICompanyDashboard
        companyId="demo-company"
        totalModels={totalModels}
        activeResearch={activeResearch}
        gpuUtilization={gpuUtilization}
        monthlyRevenue={monthlyRevenue}
        recentActivity={recentActivity}
        onNewModel={() => router.push('/ai/models')}
        onNewResearch={() => router.push('/ai/research')}
        onHireTalent={() => router.push('/ai/talent')}
      />
    </div>
  );
}

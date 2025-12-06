'use client';

import { useRouter } from 'next/navigation';
import { ModelTrainingWizard, TrainingConfig } from '@/lib/components/ai/ModelTrainingWizard';
import { RevenueAnalytics, ModelRevenue, TierStats } from '@/lib/components/ai/RevenueAnalytics';

// NOTE: Phase 1 Models Page
// Combines ModelTrainingWizard (left) and RevenueAnalytics (right) for unified model + monetization view.
// Layout kept simple; future enhancement: responsive collapsible panels or tabs.

export default function AIModelsPage() {
  const router = useRouter();

  // Placeholder revenue & usage data.
  const topModels: ModelRevenue[] = [
    { modelId: 'm-1', modelName: 'Summarizer', calls: 185000, revenue: 45000, avgResponseTime: 210 },
    { modelId: 'm-2', modelName: 'VisionTagger', calls: 92000, revenue: 18000, avgResponseTime: 155 },
    { modelId: 'm-3', modelName: 'ChatAssistant', calls: 250000, revenue: 62000, avgResponseTime: 320 },
  ];

  const tierDistribution: TierStats[] = [
    { tier: 'Free', count: 1800, revenue: 0 },
    { tier: 'Starter', count: 450, revenue: 15000 },
    { tier: 'Professional', count: 120, revenue: 38000 },
    { tier: 'Enterprise', count: 15, revenue: 62000 },
  ];

  const handleSubmitTraining = (config: TrainingConfig) => {
    // Placeholder submit logic; real implementation would POST to /api/ai/models
    // After submission navigate to model detail page (dynamic route planned for Phase 3)
    console.log('Training submission config', config);
    router.push('/ai/models');
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">🧪 Models & Training</h1>
      <p className="text-default-500">Configure new model training jobs and monitor revenue performance.</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <ModelTrainingWizard
            onSubmit={handleSubmitTraining}
            onCancel={() => router.push('/ai')}
          />
        </div>
        <div className="space-y-6">
          <RevenueAnalytics
            companyId="demo-company"
            mrr={160000}
            arr={160000 * 12}
            churnRate={2.8}
            apiCalls={527000}
            apiLimit={1_000_000}
            customers={1800 + 450 + 120 + 15}
            topModels={topModels}
            tierDistribution={tierDistribution}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * @file app/(game)/companies/[id]/contracts/active/page.tsx
 * @description Server wrapper page for Active Contracts dashboard
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Renders the Active Contracts dashboard client component which loads the company's
 * awarded, in-progress, completed, and failed contracts. Provides portfolio metrics
 * and interactive selection for deeper contract detail, progress updates, and bidding insights.
 */
import ActiveClient from './ActiveClient';

interface PageProps {
  params: { id: string };
}

export default function ActiveContractsPage({ params }: PageProps) {
  return (
    <div className="p-6 space-y-6" aria-labelledby="active-contracts-heading">
      <header className="space-y-2">
        <h1 id="active-contracts-heading" className="text-2xl font-semibold tracking-tight">Active & Awarded Contracts</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Monitor execution progress, quality performance, delivery risk, and portfolio health.
          Select a contract for detailed milestones, competitor bids, and progression controls.
        </p>
      </header>
      <ActiveClient companyId={params.id} />
    </div>
  );
}

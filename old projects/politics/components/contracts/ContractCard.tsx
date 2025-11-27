"use client";
/**
 * @file components/contracts/ContractCard.tsx
 * @created 2025-11-13
 * @overview Presentational card for displaying summary contract info in marketplace or lists.
 */

import type { FC } from 'react';

interface ContractCardProps {
  contract: {
    _id: string;
    title: string;
    type: string;
    industry?: string;
    value: number;
    status: string;
    duration: number;
    deadline: string;
    biddingDeadline?: string;
    complexityScore: number;
    riskLevel: string;
    requiredSkills: Record<string, number>;
    totalBids: number;
    marketDemand?: number;
  };
  onClick?: () => void;
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function riskColor(risk: string) {
  switch (risk) {
    case 'Low': return 'text-green-600';
    case 'Medium': return 'text-yellow-600';
    case 'High': return 'text-orange-600';
    case 'Critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

const ContractCard: FC<ContractCardProps> = ({ contract, onClick }) => {
  const daysRemaining = Math.max(0, Math.ceil((new Date(contract.deadline).getTime() - Date.now()) / (1000*60*60*24)));
  const biddingEndsIn = contract.biddingDeadline ? Math.max(0, Math.ceil((new Date(contract.biddingDeadline).getTime() - Date.now()) / (1000*60*60*24))) : null;

  return (
    <article
      className="group rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' && onClick) onClick(); }}
      aria-label={`Contract ${contract.title}`}
    >
      <header className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">{contract.title}</h2>
        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium border border-blue-200">
          {contract.type}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex flex-col">
          <span className="text-gray-500">Value</span>
          <span className="font-medium">{formatCurrency(contract.value)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Duration</span>
          <span className="font-medium">{contract.duration}d</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Complexity</span>
          <span className="font-medium">{contract.complexityScore}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Risk</span>
          <span className={`font-medium ${riskColor(contract.riskLevel)}`}>{contract.riskLevel}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Bids</span>
          <span className="font-medium">{contract.totalBids}</span>
        </div>
        {typeof contract.marketDemand === 'number' && (
          <div className="flex flex-col">
            <span className="text-gray-500">Demand</span>
            <span className="font-medium">{contract.marketDemand}</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 border-t">
        {biddingEndsIn !== null && (
          <span className="text-[10px] px-2 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
            Bidding: {biddingEndsIn}d left
          </span>
        )}
        <span className="text-[10px] px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200">
          Deadline: {daysRemaining}d
        </span>
        <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
          Status: {contract.status}
        </span>
      </div>
    </article>
  );
};

export default ContractCard;

/**
 * Implementation Notes:
 * - Accessible card: role=button + keyboard activation.
 * - line-clamp ensures consistent height while preserving responsiveness.
 * - Computed days remaining to convey urgency.
 * - Strict typing for contract summary fields expected from marketplace endpoint.
 */

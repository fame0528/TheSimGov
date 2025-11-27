/**
 * @file components/departments/CampaignCard.tsx
 * @description Marketing campaign display card
 * @created 2025-11-13
 */

'use client';

interface CampaignCardProps {
  campaign: {
    _id: string;
    name: string;
    campaignType: string;
    status: string;
    budget: number;
    spent: number;
    roi: number;
    reach: number;
    conversions: number;
    customers: number;
    revenue: number;
    brandLift: number;
    percentComplete: number;
    daysRemaining: number;
  };
  onUpdate: () => void;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Paused':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BrandAwareness': return '📢';
      case 'LeadGeneration': return '🎯';
      case 'ProductLaunch': return '🚀';
      case 'CustomerRetention': return '💝';
      case 'MarketExpansion': return '🌍';
      case 'SocialMedia': return '📱';
      default: return '📊';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>{getTypeIcon(campaign.campaignType)}</span>
            {campaign.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{campaign.campaignType}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
          {campaign.status}
        </span>
      </div>

      {/* Budget & ROI */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Budget</p>
          <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            Spent: ${campaign.spent.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</p>
          <p className={`text-lg font-bold ${campaign.roi >= 100 ? 'text-green-500' : campaign.roi >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
            {campaign.roi.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Reach</p>
          <p className="text-sm font-semibold">{(campaign.reach || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Conversions</p>
          <p className="text-sm font-semibold">{campaign.conversions || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Customers</p>
          <p className="text-sm font-semibold">{campaign.customers || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Revenue</p>
          <p className="text-sm font-semibold">${(campaign.revenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {campaign.status === 'Active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-xs font-semibold">{campaign.percentComplete.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${campaign.percentComplete}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{campaign.daysRemaining} days remaining</p>
        </div>
      )}

      {/* Brand Lift */}
      {campaign.brandLift > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Brand Lift</p>
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
            +{campaign.brandLift.toFixed(1)} points
          </p>
        </div>
      )}
    </div>
  );
}

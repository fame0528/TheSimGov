/**
 * @file app/(game)/companies/[id]/departments/marketing/page.tsx
 * @description Marketing department dashboard with campaigns
 * @created 2025-11-13
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import CampaignCard from '@/components/departments/CampaignCard';

interface Campaign {
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
}

export default function MarketingDepartmentPage({ params }: { params: { id: string } }) {
  const { id: companyId } = params;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandReputation, setBrandReputation] = useState(0);
  const [marketShare, setMarketShare] = useState(0);
  const [activeCampaigns, setActiveCampaigns] = useState(0);

  useEffect(() => {
    fetchMarketingData();
  }, [companyId]);

  const fetchMarketingData = async () => {
    try {
      const [campaignsRes, deptRes] = await Promise.all([
        fetch(`/api/departments/marketing/campaigns?companyId=${companyId}`),
        fetch(`/api/departments?companyId=${companyId}&type=marketing`),
      ]);

      if (!campaignsRes.ok || !deptRes.ok) throw new Error('Failed to fetch marketing data');

      const campaignsData = await campaignsRes.json();
      const deptData = await deptRes.json();

      setCampaigns(campaignsData.campaigns || []);
      setActiveCampaigns(campaignsData.activeCampaigns || 0);

      const marketingDept = deptData.departments?.[0];
      if (marketingDept) {
        setBrandReputation(marketingDept.brandReputation || 0);
        setMarketShare(marketingDept.marketShare || 0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch marketing data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading marketing department...</div>
      </div>
    );
  }

  const totalROI = campaigns
    .filter(c => c.status === 'Completed' || c.status === 'Active')
    .reduce((sum, c) => sum + (c.roi || 0), 0) / Math.max(1, campaigns.filter(c => c.status === 'Completed' || c.status === 'Active').length);

  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Marketing Department</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage campaigns and grow brand awareness
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Brand Reputation</p>
          <p className="text-3xl font-bold">{brandReputation}/100</p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            {brandReputation >= 75 ? '✅ Excellent' : brandReputation >= 50 ? '✅ Good' : '⚠️ Needs Work'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Market Share</p>
          <p className="text-3xl font-bold">{marketShare.toFixed(2)}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Campaigns</p>
          <p className="text-3xl font-bold">{activeCampaigns}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg ROI</p>
          <p className="text-3xl font-bold">{totalROI.toFixed(0)}%</p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            Revenue: ${totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Marketing Campaigns</h2>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            onClick={() => toast.info('Launch campaign feature coming soon')}
          >
            + Launch Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No campaigns launched yet</p>
            <p className="text-sm">Create your first marketing campaign to grow your brand</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} onUpdate={fetchMarketingData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @file src/components/politics/PoliticalInfluencePanel.tsx
 * @description Political influence dashboard component
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Displays company political capabilities, influence points, and available actions.
 * Shows donation history, lobbying results, and "Run for Office" option (Level 5).
 * Real-time influence tracking with level-appropriate UI elements.
 *
 * USAGE:
 * ```tsx
 * import PoliticalInfluencePanel from '@/components/politics/PoliticalInfluencePanel';
 *
 * <PoliticalInfluencePanel
 *   companyId="xxx"
 *   level={3}
 *   totalInfluence={250}
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { CompanyLevel } from '@/lib/types/game';
import { getPoliticalCapabilities } from '@/lib/utils/politicalinfluence';

interface PoliticalInfluencePanelProps {
  companyId?: string;
  level: CompanyLevel;
}

interface Donation {
  id: string;
  candidateName: string;
  officeType: string;
  amount: number;
  influencePoints: number;
  donatedAt: string;
}

interface LobbyingAction {
  id: string;
  targetLegislation: string;
  legislationType: string;
  status: 'Pending' | 'Successful' | 'Failed';
  successProbability: number;
  initiatedAt: string;
  outcome?: {
    effectType: string;
    effectValue: number;
    duration: number;
  };
}

export default function PoliticalInfluencePanel({
  companyId,
  level,
}: PoliticalInfluencePanelProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [lobbyingActions, setLobbyingActions] = useState<LobbyingAction[]>([]);
  const [totalInfluence, setTotalInfluence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);

  // Get political capabilities
  const capabilities = getPoliticalCapabilities(level);

  // Load political data
  useEffect(() => {
    const loadPoliticalData = async () => {
      // Guard: Don't fetch if no companyId
      if (!companyId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);

        // Fetch eligibility data
        const eligibilityResponse = await fetch(`/api/politics/eligibility?companyId=${companyId}`);
        if (eligibilityResponse.ok) {
          const eligibilityData = await eligibilityResponse.json();
          // Calculate total influence from donations (would need to fetch donation history)
          // For now, set a placeholder
          setTotalInfluence(0);
        }

        // Fetch lobbying history
        const lobbyResponse = await fetch(`/api/politics/lobby?companyId=${companyId}`);
        if (lobbyResponse.ok) {
          const lobbyData = await lobbyResponse.json();
          setLobbyingActions(lobbyData.actions || []);
        }

      } catch (error) {
        console.error('Failed to load political data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPoliticalData();
  }, [companyId]);

  if (level < 2) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Political Influence</h2>
        <div className="text-gray-400">
          <p className="mb-2">🔒 Political features locked</p>
          <p className="text-sm">Reach Level 2 to unlock campaign donations</p>
          <p className="text-sm">Reach Level 3 to unlock lobbying</p>
          <p className="text-sm">Reach Level 5 to run for political office</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-yellow-400">Political Influence</h2>
          <p className="text-gray-400 text-sm mt-1">
            Level {level} Political Power
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-yellow-400">{totalInfluence}</div>
          <div className="text-xs text-gray-400">Influence Points</div>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Campaign Donations</div>
          <div className="text-lg font-bold text-green-400">
            {capabilities.canDonateToCampaigns ? `Up to $${capabilities.maxDonationAmount.toLocaleString()}` : '🔒 Locked'}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Lobbying Power</div>
          <div className="text-lg font-bold text-blue-400">
            {capabilities.canLobby ? `${capabilities.lobbyingPowerPoints} Points` : '🔒 Level 3+'}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Government Contracts</div>
          <div className="text-lg font-bold text-purple-400">
            {capabilities.governmentContractAccess ? '✓ Eligible' : '❌ Ineligible'}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Run for Office</div>
          <div className="text-lg font-bold text-red-400">
            {capabilities.canRunForOffice ? '✓ Available' : '🔒 Level 5'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {capabilities.canDonateToCampaigns && (
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            💰 Donate to Campaign
          </button>
        )}

        {capabilities.canLobby && (
          <button
            onClick={() => setShowLobbyModal(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            🏛️ Lobby for Legislation
          </button>
        )}

        {capabilities.canRunForOffice && (
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            🎖️ Run for Office
          </button>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-200">Recent Political Activity</h3>

        {donations.length === 0 && lobbyingActions.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-6">
            No political activity yet. Start by making a campaign donation!
          </div>
        ) : (
          <div className="space-y-2">
            {/* Show recent donations */}
            {donations.slice(0, 3).map((donation) => (
              <div key={donation.id} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-green-400">
                      💰 Donated to {donation.candidateName}
                    </div>
                    <div className="text-sm text-gray-400">
                      ${donation.amount.toLocaleString()} → {donation.influencePoints} influence points
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(donation.donatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Show recent lobbying actions */}
            {lobbyingActions.slice(0, 3).map((action) => (
              <div key={action.id} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-blue-400">
                      🏛️ Lobbied for {action.targetLegislation}
                    </div>
                    <div className="text-sm text-gray-400">
                      {action.legislationType} • {action.successProbability}% success rate • {action.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(action.initiatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
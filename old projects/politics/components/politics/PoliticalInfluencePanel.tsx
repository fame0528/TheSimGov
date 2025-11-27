/**
 * @file components/politics/PoliticalInfluencePanel.tsx
 * @description Political influence dashboard component
 * @created 2025-11-15
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
import { CompanyLevel } from '@/types/companyLevels';

interface PoliticalInfluencePanelProps {
  companyId: string;
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
  const [donations] = useState<Donation[]>([]);
  const [lobbyingActions] = useState<LobbyingAction[]>([]);
  const [totalInfluence, setTotalInfluence] = useState(0);
  const [, setShowDonateModal] = useState(false);
  const [, setShowLobbyModal] = useState(false);
  
  // Political capabilities by level
  const canDonate = level >= 2;
  const canLobby = level >= 3;
  const canRunForOffice = level >= 5;
  
  const maxDonation = ({
    2: 5000,
    3: 50000,
    4: 500000,
    5: 10000000,
  } as Record<number, number>)[level] || 0;
  
  const lobbyingPower = ({
    3: 10,
    4: 50,
    5: 200,
  } as Record<number, number>)[level] || 0;
  
  // Load political data
  useEffect(() => {
    // Fetch donations and lobbying history
    // This would call the API endpoints
    
    // Mock data for now
    setTotalInfluence(150);
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
            {canDonate ? `Up to $${maxDonation.toLocaleString()}` : '🔒 Locked'}
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Lobbying Power</div>
          <div className="text-lg font-bold text-blue-400">
            {canLobby ? `${lobbyingPower} Points` : '🔒 Level 3+'}
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Government Contracts</div>
          <div className="text-lg font-bold text-purple-400">✓ Eligible</div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Run for Office</div>
          <div className="text-lg font-bold text-red-400">
            {canRunForOffice ? '✓ Available' : '🔒 Level 5'}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        {canDonate && (
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            💰 Donate to Campaign
          </button>
        )}
        
        {canLobby && (
          <button
            onClick={() => setShowLobbyModal(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            🏛️ Lobby for Legislation
          </button>
        )}
        
        {canRunForOffice && (
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
            {/* Show recent donations and lobbying actions */}
            <div className="text-gray-400 text-sm">
              Activity feed would go here...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

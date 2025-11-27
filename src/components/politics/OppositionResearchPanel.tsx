/**
 * Opposition Research Panel Component
 * 
 * OVERVIEW:
 * Main UI for initiating and managing opposition research operations.
 * Displays research types, cost tiers, probability calculations, and
 * active/completed research tracking.
 * 
 * Created: 2024-11-26
 * Part of: Opposition Research System (FID-20251125-001C Phase 5)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Chip,
  Progress,
  Divider,
} from '@heroui/react';
import {
  ResearchType,
  DiscoveryTier,
  RESEARCH_SPENDING_TIERS,
  getResearchTypeName,
  getResearchTypeDescription,
  getDiscoveryTierName,
  getDiscoveryTierColor,
  getSpendingTierInfo,
  calculateDiscoveryProbabilities,
  getProbabilityOfSuccess,
  formatProbability,
  formatCurrency,
  estimateCompletionTime,
  type OppositionResearch,
} from '@/politics/systems';

interface OppositionResearchPanelProps {
  playerId: string;
  targetId: string;
  targetName: string;
  playerBudget: number;
}

export default function OppositionResearchPanel({
  playerId,
  targetId,
  targetName,
  playerBudget,
}: OppositionResearchPanelProps) {
  const { data: session } = useSession();
  
  // Form state
  const [selectedType, setSelectedType] = useState<ResearchType>(ResearchType.BACKGROUND);
  const [selectedSpend, setSelectedSpend] = useState<number>(25000);
  const [loading, setLoading] = useState(false);
  
  // Research tracking
  const [activeResearch, setActiveResearch] = useState<OppositionResearch[]>([]);
  const [completedResearch, setCompletedResearch] = useState<OppositionResearch[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load research status
  useEffect(() => {
    if (!session?.user?.id) return;
    
    fetch(`/api/politics/research/status?playerId=${session.user.id}`)
      .then(res => res.json())
      .then(data => {
        setActiveResearch(data.activeResearch || []);
        setCompletedResearch(data.completedResearch || []);
      })
      .catch(console.error);
  }, [session, refreshKey]);

  // Calculate probabilities for current selection
  const previousResearchCount = completedResearch.filter(
    r => r.targetId === targetId && r.researchType === selectedType
  ).length;

  const probabilities = calculateDiscoveryProbabilities(
    selectedType,
    selectedSpend,
    targetId,
    previousResearchCount
  );

  const successProbability = getProbabilityOfSuccess(probabilities);
  const tierInfo = getSpendingTierInfo(selectedSpend);
  const timing = estimateCompletionTime(selectedType, 168);

  // Handle research initiation
  const handleInitiateResearch = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/politics/research/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: session.user.id,
          targetId,
          researchType: selectedType,
          amountSpent: selectedSpend,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRefreshKey(prev => prev + 1); // Refresh research list
        alert(`Research initiated! Outcome: ${data.research.discoveryResult?.tier || 'IN_PROGRESS'}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to initiate research:', error);
      alert('Failed to initiate research');
    } finally {
      setLoading(false);
    }
  };

  const canAfford = playerBudget >= selectedSpend;

  return (
    <div className="space-y-6">
      {/* Research Initiation Card */}
      <Card className="bg-gradient-to-br from-rose-500/10 via-rose-600/5 to-transparent backdrop-blur-xl border border-rose-500/20">
        <CardHeader className="flex flex-col gap-2 pb-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
              🔍 Opposition Research
            </h3>
            <Chip color="default" variant="flat">
              Target: {targetName}
            </Chip>
          </div>
          <p className="text-sm text-gray-400">
            Investigate opponent for damaging information
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Research Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Research Category</label>
            <Select
              selectedKeys={[selectedType]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as ResearchType;
                setSelectedType(selected);
              }}
              placeholder="Select research type"
              classNames={{
                trigger: "bg-rose-500/10 border-rose-500/20",
              }}
            >
              {Object.values(ResearchType).map((type) => (
                <SelectItem key={type}>
                  {getResearchTypeName(type)}
                </SelectItem>
              ))}
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              {getResearchTypeDescription(selectedType)}
            </p>
          </div>

          {/* Spending Tier Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Investment Level - {tierInfo.name}
            </label>
            <Select
              selectedKeys={[selectedSpend.toString()]}
              onSelectionChange={(keys) => {
                const selected = parseInt(Array.from(keys)[0] as string);
                setSelectedSpend(selected);
              }}
              placeholder="Select spending tier"
              classNames={{
                trigger: "bg-rose-500/10 border-rose-500/20",
              }}
            >
              {RESEARCH_SPENDING_TIERS.map((tier) => (
                <SelectItem key={tier.toString()}>
                  {formatCurrency(tier)} - {getSpendingTierInfo(tier).name}
                </SelectItem>
              ))}
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              {tierInfo.description} ({tierInfo.multiplier.toFixed(1)}x multiplier)
            </p>
          </div>

          <Divider className="bg-rose-500/20" />

          {/* Probability Analysis */}
          <div className="bg-black/20 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">Probability Analysis</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Success Chance</p>
                <p className="text-lg font-bold text-green-400">
                  {formatProbability(successProbability)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Time Required</p>
                <p className="text-lg font-bold text-blue-400">
                  {timing.realTimeMinutes.toFixed(0)}m
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(probabilities).map(([tier, prob]) => (
                <div key={tier} className="flex items-center justify-between">
                  <Chip
                    size="sm"
                    color={getDiscoveryTierColor(tier as DiscoveryTier) as any}
                    variant="flat"
                  >
                    {getDiscoveryTierName(tier as DiscoveryTier)}
                  </Chip>
                  <span className="text-sm">{formatProbability(prob)}</span>
                </div>
              ))}
            </div>

            {previousResearchCount > 0 && (
              <p className="text-xs text-yellow-400">
                ⚠️ Diminishing returns: {previousResearchCount} previous attempt{previousResearchCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Budget Status */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Campaign Budget</span>
              <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                {formatCurrency(playerBudget)}
              </span>
            </div>
            <Progress
              value={(selectedSpend / playerBudget) * 100}
              color={canAfford ? 'success' : 'danger'}
              className="h-2"
            />
            <p className="text-xs text-gray-400">
              {((selectedSpend / playerBudget) * 100).toFixed(1)}% of budget
            </p>
          </div>

          {/* Action Button */}
          <Button
            color="danger"
            variant="shadow"
            className="w-full"
            size="lg"
            onPress={handleInitiateResearch}
            isLoading={loading}
            isDisabled={!canAfford || loading}
          >
            {canAfford ? `Initiate Research - ${formatCurrency(selectedSpend)}` : 'Insufficient Budget'}
          </Button>
        </CardBody>
      </Card>

      {/* Active Research */}
      {activeResearch.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <h3 className="text-xl font-bold">🔄 Active Investigations</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {activeResearch.map((research) => (
              <div key={research.id} className="bg-black/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{getResearchTypeName(research.researchType)}</span>
                  <Chip size="sm" color="primary" variant="flat">IN PROGRESS</Chip>
                </div>
                <Progress
                  value={50}
                  color="primary"
                  className="h-1"
                />
                <p className="text-xs text-gray-400">
                  Completes: {new Date(research.completesAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Completed Research */}
      {completedResearch.length > 0 && (
        <Card className="bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent backdrop-blur-xl border border-green-500/20">
          <CardHeader>
            <h3 className="text-xl font-bold">✅ Completed Research</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {completedResearch.slice(0, 5).map((research) => (
              <div key={research.id} className="bg-black/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{getResearchTypeName(research.researchType)}</span>
                  <Chip
                    size="sm"
                    color={getDiscoveryTierColor(research.discoveryResult?.tier || DiscoveryTier.NOTHING) as any}
                    variant="flat"
                  >
                    {getDiscoveryTierName(research.discoveryResult?.tier || DiscoveryTier.NOTHING)}
                  </Chip>
                </div>
                {research.discoveryResult && research.discoveryResult.findings.length > 0 && (
                  <div className="text-xs text-gray-300 space-y-1">
                    {research.discoveryResult.findings.map((finding, i) => (
                      <p key={i}>• {finding}</p>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Quality: {research.discoveryResult?.score || 0}/100</span>
                  <span>Spent: {formatCurrency(research.amountSpent)}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/**
 * Negative Ad Manager Component
 * 
 * OVERVIEW:
 * Interface for launching attack ad campaigns using opposition research.
 * Displays effectiveness preview, backfire risk, ethics penalties, and
 * tracks launched ad performance.
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {
  NEGATIVE_AD_SPENDING_TIERS,
  getAdSpendingTier,
  calculateNegativeAdEffectiveness,
  calculateBackfireProbability,
  calculateEthicsPenalty,
  calculateVoterFatigue,
  calculateResearchEffectiveness,
  formatCurrency,
  formatEffectiveness,
  getEffectivenessTierName,
  getEffectivenessColor,
  type OppositionResearch,
  type NegativeAd,
  type ResearchQuality,
} from '@/politics/systems';

interface NegativeAdManagerProps {
  playerId: string;
  targetId: string;
  targetName: string;
  playerBudget: number;
  campaignPhase: 'ANNOUNCEMENT' | 'FUNDRAISING' | 'ACTIVE' | 'RESOLUTION';
  availableResearch: OppositionResearch[];
}

export default function NegativeAdManager({
  playerId,
  targetId,
  targetName,
  playerBudget,
  campaignPhase,
  availableResearch,
}: NegativeAdManagerProps) {
  const { data: session } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Form state
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);
  const [selectedSpend, setSelectedSpend] = useState<number>(50000);
  const [loading, setLoading] = useState(false);
  
  // Ad tracking
  const [launchedAds, setLaunchedAds] = useState<NegativeAd[]>([]);

  // Get selected research
  const selectedResearch = availableResearch.find(r => r.id === selectedResearchId);
  const researchQuality: ResearchQuality | null = selectedResearch?.discoveryResult || null;

  // Calculate effectiveness preview
  const recentAdsCount = launchedAds.filter(ad => Date.now() - new Date(ad.launchedAt).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  
  const mockEthicsPenalty = calculateEthicsPenalty(
    researchQuality?.credibility || 50,
    recentAdsCount,
    false
  );

  const mockVoterFatigue = calculateVoterFatigue(
    recentAdsCount,
    0
  );

  const effectiveness = calculateNegativeAdEffectiveness(
    researchQuality,
    selectedSpend,
    campaignPhase,
    mockEthicsPenalty,
    mockVoterFatigue
  );

  const backfireProb = calculateBackfireProbability(
    researchQuality?.credibility || 50,
    mockEthicsPenalty,
    false
  );

  const spendingTier = getAdSpendingTier(selectedSpend);
  const tierMultiplier = spendingTier === 250000 ? 1.5 : spendingTier === 100000 ? 1.3 : spendingTier === 50000 ? 1.0 : 0.7;
  const tierName = spendingTier === 250000 ? 'Saturation' : spendingTier === 100000 ? 'Major Campaign' : spendingTier === 50000 ? 'Standard Attack' : 'Minimal Ad';
  const tierDescription = spendingTier === 250000 ? 'Maximum visibility' : spendingTier === 100000 ? 'Heavy coverage' : spendingTier === 50000 ? 'Baseline effectiveness' : 'Light campaign';
  const canAfford = playerBudget >= selectedSpend;
  const canLaunch = campaignPhase !== 'ANNOUNCEMENT' && selectedResearchId && canAfford;

  // Handle ad launch
  const handleLaunchAd = async () => {
    if (!session?.user?.id || !canLaunch) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/politics/ads/negative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: session.user.id,
          targetId,
          researchId: selectedResearchId,
          amountSpent: selectedSpend,
          campaignPhase,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLaunchedAds(prev => [data.ad, ...prev]);
        onClose();
        alert(`Ad launched! Effectiveness: ${formatEffectiveness(data.analysis.effectiveness)}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to launch ad:', error);
      alert('Failed to launch ad');
    } finally {
      setLoading(false);
    }
  };

  // Risk level for backfire
  const getRiskLevel = (probability: number): { color: string; label: string } => {
    if (probability > 0.4) return { color: 'danger', label: 'HIGH RISK' };
    if (probability > 0.2) return { color: 'warning', label: 'MODERATE RISK' };
    return { color: 'success', label: 'LOW RISK' };
  };

  const riskLevel = getRiskLevel(backfireProb);

  return (
    <div className="space-y-6">
      {/* Ad Creation Card */}
      <Card className="bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent backdrop-blur-xl border border-red-500/20">
        <CardHeader className="flex flex-col gap-2 pb-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              📢 Attack Advertising
            </h3>
            <Chip color="default" variant="flat">
              Target: {targetName}
            </Chip>
          </div>
          <p className="text-sm text-gray-400">
            Launch negative ad campaign using research findings
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Phase Warning */}
          {campaignPhase === 'ANNOUNCEMENT' && (
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3">
              <p className="text-sm text-yellow-300">
                ⚠️ Negative ads cannot be launched during ANNOUNCEMENT phase
              </p>
            </div>
          )}

          {/* Research Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Research Findings ({availableResearch.length} available)
            </label>
            <Select
              selectedKeys={selectedResearchId ? [selectedResearchId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedResearchId(selected || null);
              }}
              placeholder="Select research to weaponize"
              classNames={{
                trigger: "bg-red-500/10 border-red-500/20",
              }}
              isDisabled={availableResearch.length === 0}
            >
              {availableResearch.map((research) => (
                <SelectItem key={research.id}>
                  {research.researchType} - Quality: {research.discoveryResult?.score || 0}/100
                </SelectItem>
              ))}
            </Select>
            {selectedResearch && (
              <div className="mt-2 text-xs text-gray-300 space-y-1">
                <p>Credibility: {selectedResearch.discoveryResult?.credibility || 0}%</p>
                {selectedResearch.discoveryResult?.findings.slice(0, 2).map((finding, i) => (
                  <p key={i}>• {finding}</p>
                ))}
              </div>
            )}
          </div>

          {/* Ad Spend Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ad Buy - {tierName}
            </label>
            <Select
              selectedKeys={[selectedSpend.toString()]}
              onSelectionChange={(keys) => {
                const selected = parseInt(Array.from(keys)[0] as string);
                setSelectedSpend(selected);
              }}
              placeholder="Select ad spending"
              classNames={{
                trigger: "bg-red-500/10 border-red-500/20",
              }}
            >
              {NEGATIVE_AD_SPENDING_TIERS.map((tier) => {
                const name = tier === 250000 ? 'Saturation' : tier === 100000 ? 'Major' : tier === 50000 ? 'Standard' : 'Minimal';
                return (
                  <SelectItem key={tier.toString()}>
                    {formatCurrency(tier)} - {name}
                  </SelectItem>
                );
              })}
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              {tierDescription} ({tierMultiplier.toFixed(1)}x multiplier)
            </p>
          </div>

          <Divider className="bg-red-500/20" />

          {/* Effectiveness Preview */}
          <div className="bg-black/20 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">Attack Analysis</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Effectiveness</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-bold text-${getEffectivenessColor(effectiveness)}-400`}>
                    {formatEffectiveness(effectiveness)}
                  </p>
                  <Chip size="sm" color={getEffectivenessColor(effectiveness) as any} variant="flat">
                    {getEffectivenessTierName(effectiveness)}
                  </Chip>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Backfire Risk</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-yellow-400">
                    {(backfireProb * 100).toFixed(1)}%
                  </p>
                  <Chip size="sm" color={riskLevel.color as any} variant="flat">
                    {riskLevel.label}
                  </Chip>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Research Quality</span>
                <span>{researchQuality?.score || 0}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ethics Penalty</span>
                <span className="text-yellow-400">-{mockEthicsPenalty}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Voter Fatigue</span>
                <span className="text-orange-400">{(mockVoterFatigue * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Phase Bonus</span>
                <span className="text-green-400">
                  {campaignPhase === 'ACTIVE' ? '+20%' : campaignPhase === 'FUNDRAISING' ? '-20%' : '0%'}
                </span>
              </div>
            </div>

            {backfireProb > 0.3 && (
              <p className="text-xs text-red-400">
                ⚠️ HIGH BACKFIRE RISK: Low credibility attacks may damage your reputation
              </p>
            )}
            {mockEthicsPenalty > 40 && (
              <p className="text-xs text-yellow-400">
                ⚠️ HIGH ETHICS PENALTY: Excessive negative campaigning hurts your image
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
          </div>

          {/* Launch Button */}
          <Button
            color="danger"
            variant="shadow"
            className="w-full"
            size="lg"
            onPress={onOpen}
            isDisabled={!canLaunch || loading}
          >
            {campaignPhase === 'ANNOUNCEMENT' 
              ? 'Unavailable During Announcement' 
              : !selectedResearchId
              ? 'Select Research First'
              : !canAfford
              ? 'Insufficient Budget'
              : `Launch Attack - ${formatCurrency(selectedSpend)}`
            }
          </Button>
        </CardBody>
      </Card>

      {/* Launched Ads History */}
      {launchedAds.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-transparent backdrop-blur-xl border border-orange-500/20">
          <CardHeader>
            <h3 className="text-xl font-bold">📊 Campaign History</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {launchedAds.slice(0, 5).map((ad, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {new Date(ad.launchedAt).toLocaleDateString()}
                  </span>
                  <Chip size="sm" color="warning" variant="flat">
                    {formatCurrency(ad.amountSpent)}
                  </Chip>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Effectiveness: {formatEffectiveness(65)}</span>
                  <span>Polling Impact: -5%</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">Confirm Attack Ad Launch</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>You are about to launch a negative ad campaign against <strong>{targetName}</strong>.</p>
              
              <div className="bg-black/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Investment</span>
                  <span className="font-bold">{formatCurrency(selectedSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Projected Effectiveness</span>
                  <span className="font-bold text-green-400">{formatEffectiveness(effectiveness)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Backfire Risk</span>
                  <span className={`font-bold text-${riskLevel.color === 'danger' ? 'red' : riskLevel.color === 'warning' ? 'yellow' : 'green'}-400`}>
                    {(backfireProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ethics Penalty</span>
                  <span className="font-bold text-yellow-400">-{mockEthicsPenalty}%</span>
                </div>
              </div>

              {backfireProb > 0.3 && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
                  <p className="text-sm text-red-300">
                    ⚠️ <strong>Warning:</strong> High backfire risk. This attack may damage your own reputation if voters find it not credible.
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              variant="shadow" 
              onPress={handleLaunchAd}
              isLoading={loading}
            >
              Launch Attack
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

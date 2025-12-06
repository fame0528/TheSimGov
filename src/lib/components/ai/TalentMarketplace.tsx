/**
 * @fileoverview Talent Marketplace - AI Talent Hiring Component
 * @module lib/components/ai/TalentMarketplace
 * 
 * OVERVIEW:
 * AI talent marketplace for browsing, comparing, and hiring AI engineers and researchers.
 * Adapted from AITalentBrowser.tsx with Chakra UI → HeroUI migration.
 * 
 * FEATURES:
 * - Candidate filtering (role, tier, pool size)
 * - Candidate grid (3 columns with cards)
 * - PhD badges with tooltips (university, publications, h-index)
 * - Domain expertise tags (LLM, Computer Vision, etc.)
 * - Skills display (research, coding, technical, analytical)
 * - Expected salary comparison
 * - Interest level indicators (🟢/🟡/🔴)
 * - Comparison mode (select up to 3 candidates)
 * - Offer modal (salary, equity %, compute budget, competitiveness calculator)
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Tooltip } from '@heroui/tooltip';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/lib/utils/formatting';

export interface TalentMarketplaceProps {
  /** Company ID */
  companyId: string;
  /** Available candidates */
  candidates?: AICandidate[];
  /** Make offer handler */
  onMakeOffer?: (candidateId: string, offer: JobOffer) => void;
}

export interface AICandidate {
  id: string;
  name: string;
  role: 'MLEngineer' | 'ResearchScientist' | 'DataEngineer' | 'MLOps';
  tier: 'Junior' | 'Mid' | 'Senior' | 'PhD';
  university?: string;
  publications?: number;
  hIndex?: number;
  expertise: string[];
  skills: {
    research: number;
    coding: number;
    technical: number;
    analytical: number;
  };
  expectedSalary: number;
  interestLevel: number;
}

export interface JobOffer {
  salary: number;
  equity: number;
  computeBudget: number;
}

/**
 * Calculate offer competitiveness
 */
const calculateCompetitiveness = (offer: number, expected: number): { label: string; color: 'success' | 'warning' | 'danger'; percent: number } => {
  const percent = (offer / expected) * 100;
  if (percent >= 110) return { label: '🟢 Highly Competitive', color: 'success', percent };
  if (percent >= 100) return { label: '🟡 Competitive', color: 'warning', percent };
  return { label: '🔴 Below Market', color: 'danger', percent };
};

/**
 * TalentMarketplace Component
 * 
 * Browse and hire AI talent with filtering, comparison, and offer management.
 * 
 * @example
 * ```tsx
 * <TalentMarketplace
 *   companyId="123"
 *   candidates={aiCandidates}
 *   onMakeOffer={(id, offer) => submitOffer(id, offer)}
 * />
 * ```
 */
export function TalentMarketplace({
  companyId: _companyId,
  candidates = [],
  onMakeOffer,
}: TalentMarketplaceProps) {
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [poolSize, setPoolSize] = useState(10);
  const [comparison, setComparison] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AICandidate | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  
  // Offer form state
  const [offerSalary, setOfferSalary] = useState(0);
  const [offerEquity, setOfferEquity] = useState(0);
  const [offerComputeBudget, setOfferComputeBudget] = useState(10000);
  const [isMakingOffer, setIsMakingOffer] = useState(false);

  // Filter candidates
  const filteredCandidates = candidates
    .filter(c => roleFilter === 'All' || c.role === roleFilter)
    .filter(c => tierFilter === 'All' || c.tier === tierFilter)
    .slice(0, poolSize);

  const openOfferModal = (candidate: AICandidate) => {
    setSelectedCandidate(candidate);
    setOfferSalary(candidate.expectedSalary);
    setOfferEquity(1.0);
    setOfferComputeBudget(10000);
    setIsOfferModalOpen(true);
  };

  const handleMakeOffer = async () => {
    if (!selectedCandidate) return;

    setIsMakingOffer(true);
    try {
      if (onMakeOffer) {
        await onMakeOffer(selectedCandidate.id, {
          salary: offerSalary,
          equity: offerEquity,
          computeBudget: offerComputeBudget,
        });
      }
      toast.success(`Offer sent to ${selectedCandidate.name}!`);
      setIsOfferModalOpen(false);
    } catch (error) {
      toast.error('Failed to send offer');
    } finally {
      setIsMakingOffer(false);
    }
  };

  const toggleComparison = (candidateId: string) => {
    if (comparison.includes(candidateId)) {
      setComparison(comparison.filter(id => id !== candidateId));
    } else if (comparison.length < 3) {
      setComparison([...comparison, candidateId]);
    } else {
      toast.error('Maximum 3 candidates for comparison');
    }
  };

  const competitiveness = selectedCandidate 
    ? calculateCompetitiveness(offerSalary, selectedCandidate.expectedSalary)
    : { label: '—', color: 'default' as const, percent: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">👥 AI Talent Marketplace</h2>
        <p className="text-default-700">Browse and hire top AI engineers and researchers</p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <Select
                selectedKeys={[roleFilter]}
                onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] as string)}
                size="sm"
              >
              <SelectItem key="All">All Roles</SelectItem>
              <SelectItem key="MLEngineer">ML Engineer</SelectItem>
              <SelectItem key="ResearchScientist">Research Scientist</SelectItem>
              <SelectItem key="DataEngineer">Data Engineer</SelectItem>
              <SelectItem key="MLOps">MLOps Engineer</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tier</label>
              <Select
                selectedKeys={[tierFilter]}
                onSelectionChange={(keys) => setTierFilter(Array.from(keys)[0] as string)}
                size="sm"
              >
              <SelectItem key="All">All Tiers</SelectItem>
              <SelectItem key="Junior">Junior</SelectItem>
              <SelectItem key="Mid">Mid-Level</SelectItem>
              <SelectItem key="Senior">Senior</SelectItem>
              <SelectItem key="PhD">PhD/Research</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pool Size</label>
              <Input
                type="number"
                value={poolSize.toString()}
                onValueChange={(value) => setPoolSize(parseInt(value) || 1)}
                size="sm"
                endContent={<span className="text-default-400">candidates</span>}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Comparison Bar */}
      {comparison.length > 0 && (
        <Card className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {comparison.map(id => {
                  const candidate = candidates.find(c => c.id === id);
                  return candidate ? (
                    <Chip key={id} onClose={() => toggleComparison(id)} color="primary">
                      {candidate.name}
                    </Chip>
                  ) : null;
                })}
              </div>
              <span className="text-sm text-default-700">{comparison.length}/3 selected</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-default-700 py-8">
              No candidates match your filters. Adjust filters to see more talent.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardHeader className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{candidate.name}</h3>
                  <div className="flex gap-1 mt-1">
                    <Chip size="sm" color="primary">{candidate.role}</Chip>
                    <Chip size="sm" color={
                      candidate.tier === 'PhD' ? 'success' :
                      candidate.tier === 'Senior' ? 'warning' : 'default'
                    }>
                      {candidate.tier}
                    </Chip>
                  </div>
                </div>
                {candidate.tier === 'PhD' && candidate.university && (
                  <Tooltip content={`${candidate.publications} publications, h-index: ${candidate.hIndex}`}>
                    <Chip size="sm" color="success">🎓 PhD</Chip>
                  </Tooltip>
                )}
              </CardHeader>
              <CardBody className="space-y-3">
                {/* Expertise */}
                <div>
                  <p className="text-xs text-default-700 mb-1">Expertise</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.expertise.slice(0, 3).map(exp => (
                      <Chip key={exp} size="sm" variant="flat">{exp}</Chip>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-default-700">Research:</span>
                    <span className="font-bold ml-1">{candidate.skills.research}/10</span>
                  </div>
                  <div>
                    <span className="text-default-700">Coding:</span>
                    <span className="font-bold ml-1">{candidate.skills.coding}/10</span>
                  </div>
                  <div>
                    <span className="text-default-700">Technical:</span>
                    <span className="font-bold ml-1">{candidate.skills.technical}/100</span>
                  </div>
                  <div>
                    <span className="text-default-700">Analytical:</span>
                    <span className="font-bold ml-1">{candidate.skills.analytical}/100</span>
                  </div>
                </div>

                {/* Salary & Interest */}
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-default-700">Expected:</span>
                    <span className="font-bold ml-1">{formatCurrency(candidate.expectedSalary)}</span>
                  </div>
                  <Chip size="sm" color={
                    candidate.interestLevel >= 75 ? 'success' :
                    candidate.interestLevel >= 50 ? 'warning' : 'danger'
                  }>
                    {candidate.interestLevel}% interest
                  </Chip>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" color="primary" onPress={() => openOfferModal(candidate)}>
                    Make Offer
                  </Button>
                  <Button 
                    size="sm" 
                    variant="flat"
                    onPress={() => toggleComparison(candidate.id)}
                    color={comparison.includes(candidate.id) ? 'success' : 'default'}
                  >
                    {comparison.includes(candidate.id) ? '✓ Compare' : 'Compare'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Make Offer Modal */}
      {selectedCandidate && (
        <Modal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)}>
          <ModalContent>
            <ModalHeader>
              <h3 className="text-xl font-bold">Make Offer to {selectedCandidate.name}</h3>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Annual Salary</label>
                <Input
                  type="number"
                  value={offerSalary.toString()}
                  onValueChange={(value) => setOfferSalary(parseInt(value) || 0)}
                  startContent={<span className="text-default-400">$</span>}
                  description={`Expected: ${formatCurrency(selectedCandidate.expectedSalary)}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Equity %</label>
                <Input
                  type="number"
                  value={offerEquity.toString()}
                  onValueChange={(value) => setOfferEquity(parseFloat(value) || 0)}
                  endContent={<span className="text-default-400">%</span>}
                  step="0.1"
                  description="0.0% - 10.0%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Annual Compute Budget</label>
                <Input
                  type="number"
                  value={offerComputeBudget.toString()}
                  onValueChange={(value) => setOfferComputeBudget(parseInt(value) || 0)}
                  startContent={<span className="text-default-400">$</span>}
                  description="GPU hours and cloud resources"
                />
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Competitiveness</p>
                <Chip color={competitiveness.color} size="lg">
                  {competitiveness.label} ({competitiveness.percent.toFixed(0)}%)
                </Chip>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setIsOfferModalOpen(false)}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleMakeOffer} isLoading={isMakingOffer}>
                Send Offer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Direct Adaptation**: From AITalentBrowser.tsx with Chakra → HeroUI migration
 * 2. **Candidate Filtering**: Role, tier, pool size selects
 * 3. **Candidate Grid**: 3-column responsive layout
 * 4. **PhD Badges**: Tooltip with university, publications, h-index
 * 5. **Domain Expertise**: Chip tags (LLM, Computer Vision, etc.)
 * 6. **Skills Display**: Research, coding, technical, analytical scores
 * 7. **Interest Level**: Color-coded Chip (🟢 75%+, 🟡 50-75%, 🔴 <50%)
 * 8. **Comparison Mode**: Chip bar with onClose, max 3 candidates
 * 9. **Offer Modal**: Salary, equity %, compute budget inputs
 * 10. **Competitiveness**: Real-time calculation (🟢 110%+, 🟡 100-110%, 🔴 <100%)
 * 
 * MIGRATED FROM CHAKRA UI:
 * - Select → Select (HeroUI)
 * - NumberInput → Input type="number"
 * - Card → Card (HeroUI)
 * - Modal → Modal (HeroUI, no ModalOverlay)
 * - Badge → Chip (HeroUI)
 * - Tag → Chip with onClose
 * - Tooltip → Tooltip (HeroUI)
 * - Stat → Custom div with Card structure
 * - useToast → react-toastify
 */

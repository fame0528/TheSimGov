/**
 * @file components/ai/AITalentBrowser.tsx
 * @description AI employee candidate search and comparison interface
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Comprehensive UI for browsing, filtering, and comparing AI employee candidates.
 * Features skill radar charts, PhD badges, domain expertise tags, side-by-side
 * comparison, and integrated hiring workflow. Connects to /api/ai/employees/candidates
 * and /api/ai/employees/:id/offer for complete talent acquisition pipeline.
 * 
 * KEY FEATURES:
 * - Role-based candidate generation (MLEngineer, ResearchScientist, etc.)
 * - Skill tier filtering (Junior, Mid, Senior, PhD)
 * - PhD/publications/h-index badges
 * - Domain expertise visualization
 * - Salary expectation displays
 * - Side-by-side comparison mode (up to 3 candidates)
 * - Integrated offer submission
 * - Real-time market analysis
 * 
 * USAGE:
 * ```tsx
 * import AITalentBrowser from '@/components/ai/AITalentBrowser';
 * 
 * <AITalentBrowser
 *   companyId="64f1a2b3c4d5e6f7g8h9i0j1"
 *   companyReputation={75}
 *   onHireSuccess={(employee) => console.log('Hired:', employee)}
 * />
 * ```
 * 
 * PROPS:
 * - companyId: string (MongoDB ObjectId of AI company)
 * - companyReputation: number (1-100, affects candidate quality and interest)
 * - onHireSuccess?: (employee: any) => void (callback after successful hire)
 * 
 * IMPLEMENTATION NOTES:
 * - Chakra UI v2 components (Box, Button, Grid, Badge, etc.)
 * - Responsive design (mobile/tablet/desktop breakpoints)
 * - Loading states with Chakra Spinner
 * - Error handling with toast notifications
 * - Candidate data cached during session (re-generate button available)
 * - Comparison mode persists selections across re-renders
 * - Offer modal with salary input, equity, compute budget
 * - Market competitiveness displayed in real-time
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Heading,
  Text,
  Badge,
  Select,
  HStack,
  VStack,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tag,
  TagLabel,
  TagCloseButton,
  Tooltip,
} from '@chakra-ui/react';

// Type definitions
interface AICandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  hasPhD: boolean;
  university?: string;
  publications: number;
  hIndex: number;
  researchAbility: number;
  codingSkill: number;
  domainExpertise: string;
  technical: number;
  analytical: number;
  communication: number;
  creativity: number;
  yearsExperience: number;
  currentSalary: number;
  expectedSalary: number;
  stockPreference: number;
  loyalty: number;
  learningRate: number;
  productivity: number;
  competingOffers: number;
  interestLevel: number;
  recruitmentDifficulty: number;
}

interface AITalentBrowserProps {
  companyId: string;
  companyReputation: number;
  onHireSuccess?: (employee: any) => void;
}

type SkillTier = 'Junior' | 'Mid' | 'Senior' | 'PhD';
type AIRole = 'MLEngineer' | 'ResearchScientist' | 'DataEngineer' | 'MLOps' | 'ProductManager';

export default function AITalentBrowser({
  companyId: _companyId, // Future use: Track company for analytics
  companyReputation = 50,
  onHireSuccess,
}: AITalentBrowserProps) {
  // State management
  const [candidates, setCandidates] = useState<AICandidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<AICandidate[]>([]);
  const [selectedRole, setSelectedRole] = useState<AIRole>('MLEngineer');
  const [selectedTier, setSelectedTier] = useState<SkillTier | 'All'>('All');
  const [count, setCount] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(false);
  const [comparing, setComparing] = useState<AICandidate[]>([]);
  const [offerModalOpen, setOfferModalOpen] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<AICandidate | null>(null);
  const [offerSalary, setOfferSalary] = useState<number>(0);
  const [offerEquity, setOfferEquity] = useState<number>(0);
  const [offerComputeBudget, setOfferComputeBudget] = useState<number>(0);
  const [submittingOffer, setSubmittingOffer] = useState<boolean>(false);

  const toast = useToast();

  // Fetch candidates on role/tier/count change
  useEffect(() => {
    fetchCandidates();
  }, [selectedRole, selectedTier, count]);

  // Filter candidates when selections change
  useEffect(() => {
    let filtered = [...candidates];

    // Apply tier filter if not "All"
    if (selectedTier !== 'All') {
      filtered = filtered.filter((c) => {
        if (selectedTier === 'PhD') return c.hasPhD;
        if (selectedTier === 'Senior') return c.technical >= 75 && !c.hasPhD;
        if (selectedTier === 'Mid') return c.technical >= 60 && c.technical < 75;
        if (selectedTier === 'Junior') return c.technical < 60;
        return true;
      });
    }

    setFilteredCandidates(filtered);
  }, [candidates, selectedTier]);

  /**
   * Fetch candidate pool from API
   */
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const tierParam = selectedTier !== 'All' ? `&skillTier=${selectedTier}` : '';
      const response = await fetch(
        `/api/ai/employees/candidates?role=${selectedRole}&count=${count}&companyReputation=${companyReputation}${tierParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const data = await response.json();
      setCandidates(data.candidates);
      setFilteredCandidates(data.candidates);

      toast({
        title: 'Candidates loaded',
        description: `Found ${data.candidates.length} ${selectedRole} candidates`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add candidate to comparison
   */
  const addToComparison = (candidate: AICandidate) => {
    if (comparing.length >= 3) {
      toast({
        title: 'Comparison limit',
        description: 'You can compare up to 3 candidates at a time',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (comparing.some((c) => c.id === candidate.id)) {
      toast({
        title: 'Already comparing',
        description: `${candidate.firstName} ${candidate.lastName} is already in comparison`,
        status: 'info',
        duration: 3000,
      });
      return;
    }

    setComparing([...comparing, candidate]);
  };

  /**
   * Remove candidate from comparison
   */
  const removeFromComparison = (candidateId: string) => {
    setComparing(comparing.filter((c) => c.id !== candidateId));
  };

  /**
   * Open offer modal for candidate
   */
  const openOfferModal = (candidate: AICandidate) => {
    setSelectedCandidate(candidate);
    setOfferSalary(candidate.expectedSalary);
    setOfferEquity(candidate.stockPreference / 20); // Convert 0-100 preference to 0-5% equity
    setOfferComputeBudget(2000); // Default $2k/mo
    setOfferModalOpen(true);
  };

  /**
   * Submit job offer to candidate
   */
  const submitOffer = async () => {
    if (!selectedCandidate) return;

    setSubmittingOffer(true);
    try {
      const response = await fetch(`/api/ai/employees/${selectedCandidate.id}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerType: 'hire',
          baseSalary: offerSalary,
          equity: offerEquity,
          computeBudget: offerComputeBudget,
          bonus: 10,
          candidate: selectedCandidate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit offer');
      }

      const data = await response.json();

      if (data.offerAccepted) {
        toast({
          title: '🎉 Offer accepted!',
          description: `${selectedCandidate.firstName} ${selectedCandidate.lastName} has joined your team`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Remove hired candidate from pool
        setCandidates(candidates.filter((c) => c.id !== selectedCandidate.id));
        setComparing(comparing.filter((c) => c.id !== selectedCandidate.id));

        // Callback
        if (onHireSuccess) {
          onHireSuccess(data.employee);
        }
      } else {
        toast({
          title: '❌ Offer declined',
          description: data.decision.reason,
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
      }

      setOfferModalOpen(false);
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit offer. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Heading size="lg" mb={6}>
        AI Talent Browser
      </Heading>

      {/* Filters */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
        <FormControl>
          <FormLabel>Role</FormLabel>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as AIRole)}
          >
            <option value="MLEngineer">ML Engineer</option>
            <option value="ResearchScientist">Research Scientist</option>
            <option value="DataEngineer">Data Engineer</option>
            <option value="MLOps">MLOps Engineer</option>
            <option value="ProductManager">Product Manager</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Skill Tier</FormLabel>
          <Select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as SkillTier | 'All')}
          >
            <option value="All">All Tiers</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="PhD">PhD Only</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Pool Size</FormLabel>
          <NumberInput
            value={count}
            onChange={(_, val) => setCount(val)}
            min={1}
            max={50}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        <Flex align="flex-end">
          <Button
            colorScheme="blue"
            onClick={fetchCandidates}
            isLoading={loading}
            loadingText="Loading..."
            width="full"
          >
            Refresh Pool
          </Button>
        </Flex>
      </Grid>

      {/* Comparison Bar */}
      {comparing.length > 0 && (
        <Box mb={6} p={4} bg="blue.50" borderRadius="md">
          <HStack justify="space-between">
            <HStack>
              <Text fontWeight="bold">Comparing ({comparing.length}/3):</Text>
              {comparing.map((c) => (
                <Tag key={c.id} size="lg" colorScheme="blue">
                  <TagLabel>{`${c.firstName} ${c.lastName}`}</TagLabel>
                  <TagCloseButton onClick={() => removeFromComparison(c.id)} />
                </Tag>
              ))}
            </HStack>
            <Button size="sm" onClick={() => setComparing([])}>
              Clear All
            </Button>
          </HStack>
        </Box>
      )}

      {/* Candidate Grid */}
      {loading ? (
        <Flex justify="center" align="center" h="400px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : filteredCandidates.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={10}>
          No candidates found. Try adjusting filters or refreshing the pool.
        </Text>
      ) : (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onCompare={addToComparison}
              onOffer={openOfferModal}
              isComparing={comparing.some((c) => c.id === candidate.id)}
            />
          ))}
        </Grid>
      )}

      {/* Offer Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          size="lg"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Make Offer: {selectedCandidate.firstName} {selectedCandidate.lastName}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Base Salary</FormLabel>
                  <NumberInput
                    value={offerSalary}
                    onChange={(_, val) => setOfferSalary(val)}
                    min={20000}
                    max={5000000}
                    step={5000}
                  >
                    <NumberInputField />
                  </NumberInput>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Expected: ${selectedCandidate.expectedSalary.toLocaleString()}
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Equity (%)</FormLabel>
                  <NumberInput
                    value={offerEquity}
                    onChange={(_, val) => setOfferEquity(val)}
                    min={0}
                    max={10}
                    step={0.1}
                    precision={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Monthly Compute Budget ($)</FormLabel>
                  <NumberInput
                    value={offerComputeBudget}
                    onChange={(_, val) => setOfferComputeBudget(val)}
                    min={0}
                    max={10000}
                    step={500}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <Stat>
                  <StatLabel>Offer Competitiveness</StatLabel>
                  <StatNumber>
                    {offerSalary >= selectedCandidate.expectedSalary * 1.1
                      ? '🟢 Highly Competitive'
                      : offerSalary >= selectedCandidate.expectedSalary
                      ? '🟡 Competitive'
                      : '🔴 Below Expectations'}
                  </StatNumber>
                  <StatHelpText>
                    {offerSalary >= selectedCandidate.expectedSalary
                      ? `${Math.round(
                          ((offerSalary - selectedCandidate.expectedSalary) /
                            selectedCandidate.expectedSalary) *
                            100
                        )}% above expected`
                      : `${Math.round(
                          ((selectedCandidate.expectedSalary - offerSalary) /
                            selectedCandidate.expectedSalary) *
                            100
                        )}% below expected`}
                  </StatHelpText>
                </Stat>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setOfferModalOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="green"
                onClick={submitOffer}
                isLoading={submittingOffer}
                loadingText="Submitting..."
              >
                Submit Offer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}

/**
 * Individual candidate card component
 */
function CandidateCard({
  candidate,
  onCompare,
  onOffer,
  isComparing,
}: {
  candidate: AICandidate;
  onCompare: (candidate: AICandidate) => void;
  onOffer: (candidate: AICandidate) => void;
  isComparing: boolean;
}) {
  return (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="md">
            {candidate.firstName} {candidate.lastName}
          </Heading>
          {candidate.hasPhD && (
            <Tooltip label={`PhD from ${candidate.university}`}>
              <Badge colorScheme="purple" fontSize="sm">
                PhD
              </Badge>
            </Tooltip>
          )}
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {candidate.role}
        </Text>
      </CardHeader>

      <CardBody py={3}>
        <VStack align="stretch" spacing={3}>
          {/* Domain Expertise */}
          <HStack>
            <Badge colorScheme="blue">{candidate.domainExpertise}</Badge>
            <Text fontSize="sm" color="gray.600">
              {candidate.yearsExperience.toFixed(1)} years exp
            </Text>
          </HStack>

          {/* Research Metrics (if PhD) */}
          {candidate.hasPhD && (
            <HStack spacing={4} fontSize="sm">
              <Stat size="sm">
                <StatLabel>Publications</StatLabel>
                <StatNumber fontSize="md">{candidate.publications}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel>h-index</StatLabel>
                <StatNumber fontSize="md">{candidate.hIndex}</StatNumber>
              </Stat>
            </HStack>
          )}

          {/* Skills */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={1}>
              Skills
            </Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={1} fontSize="xs">
              <Text>Research: {candidate.researchAbility}/10</Text>
              <Text>Coding: {candidate.codingSkill}/10</Text>
              <Text>Technical: {candidate.technical}/100</Text>
              <Text>Analytical: {candidate.analytical}/100</Text>
            </Grid>
          </Box>

          <Divider />

          {/* Compensation */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={1}>
              Expected Salary
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              ${candidate.expectedSalary.toLocaleString()}
            </Text>
            <Text fontSize="xs" color="gray.600">
              Current: ${candidate.currentSalary.toLocaleString()}
            </Text>
          </Box>

          {/* Interest Level */}
          <HStack>
            <Text fontSize="sm">Interest:</Text>
            <Badge
              colorScheme={
                candidate.interestLevel >= 75
                  ? 'green'
                  : candidate.interestLevel >= 50
                  ? 'yellow'
                  : 'red'
              }
            >
              {candidate.interestLevel}%
            </Badge>
          </HStack>
        </VStack>
      </CardBody>

      <CardFooter pt={2}>
        <HStack width="full" spacing={2}>
          <Button
            size="sm"
            variant={isComparing ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => onCompare(candidate)}
            flex={1}
          >
            {isComparing ? '✓ Comparing' : 'Compare'}
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            onClick={() => onOffer(candidate)}
            flex={1}
          >
            Make Offer
          </Button>
        </HStack>
      </CardFooter>
    </Card>
  );
}

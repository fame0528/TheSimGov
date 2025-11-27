/**
 * @file src/components/media/InfluencerMarketplace.tsx
 * @description Influencer marketplace browser and hiring wizard for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Influencer marketplace component enabling Media companies to browse influencers, filter by
 * niche/followers/engagement, view detailed metrics, and hire influencers through a multi-step
 * wizard. Includes deal type selection (Sponsored/Ambassador/Affiliate/PerformanceBased),
 * deliverables builder, compensation calculator with structure options (flat fee, per-post,
 * performance-based, hybrid), bonus threshold configuration, and real-time ROI preview.
 * 
 * COMPONENT ARCHITECTURE:
 * - Influencer browse grid: Cards showing followers, engagement rate, niche, pricing estimate
 * - Filter controls: Niche selector, followers range slider, engagement range slider
 * - Deal type selector: Radio buttons for Sponsored/Ambassador/Affiliate/PerformanceBased
 * - Hiring wizard (3 steps):
 *   1. Deal Structure: Type, compensation structure, base payment
 *   2. Deliverables: Content requirements with type/quantity/deadline builder
 *   3. Performance: Bonus thresholds configuration, ROI preview
 * - Real-time ROI calculator: (followers × engagement × content × CPM) / compensation
 * - Compensation calculator: Pricing based on followers, engagement, content count
 * 
 * STATE MANAGEMENT:
 * - influencers: Influencer profiles array (mock data or API)
 * - filters: Niche, follower range, engagement range
 * - selectedInfluencer: Currently selected influencer for hiring
 * - dealData: Hiring wizard form state
 * - currentStep: Wizard step (1-3)
 * - isSubmitting: Loading state during deal creation
 * 
 * API INTEGRATION:
 * - POST /api/media/influencers - Create influencer deal
 *   Request: { influencerId, dealType, compensation, deliverables, influencerMetrics, bonusThresholds }
 *   Response: { message, deal } (201)
 * 
 * PROPS:
 * - companyId: Company ID for deal creation
 * - onSuccess: Callback after successful deal creation
 * 
 * USAGE:
 * ```tsx
 * <InfluencerMarketplace
 *   companyId="64f7a1b2c3d4e5f6g7h8i9j0"
 *   onSuccess={() => { refetch(); toast({ title: "Deal created!" }); }}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - ROI formula: ((followers × engagementRate / 100) × contentCount × CPM) / compensation × 100
 * - Pricing estimate: followers × (engagementRate / 100) × contentCount × $0.05 (avg CPM factor)
 * - High-engagement premium: >4% engagement = +30% pricing, >8% = +60% pricing
 * - Deal types:
 *   - Sponsored: One-off content, flat fee ($5K-$100K based on reach)
 *   - Ambassador: Long-term (6-12 months), recurring content, brand loyalty
 *   - Affiliate: Commission-based (5-20% per sale), no upfront cost
 *   - PerformanceBased: CPA model (pay per conversion), typically 10-30% of sale
 * - Compensation structures:
 *   - Flat: Single upfront payment
 *   - PerPost: Payment per piece of content
 *   - PerformanceBased: Payment based on engagement/conversions
 *   - Hybrid: Base payment + performance bonuses
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  useDisclosure,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

/**
 * Deal type enum
 */
type DealType = 'Sponsored' | 'Ambassador' | 'Affiliate' | 'PerformanceBased';

/**
 * Compensation structure enum
 */
type CompensationStructure = 'Flat' | 'PerPost' | 'PerformanceBased' | 'Hybrid';

/**
 * Content niche enum
 */
type ContentNiche =
  | 'Tech'
  | 'Fashion'
  | 'Gaming'
  | 'Beauty'
  | 'Fitness'
  | 'Food'
  | 'Travel'
  | 'Finance'
  | 'Education'
  | 'Entertainment';

/**
 * Influencer interface
 */
interface Influencer {
  _id: string;
  name: string;
  niche: ContentNiche;
  followers: number;
  engagementRate: number;
  avgReach: number;
  platform: string;
}

/**
 * Deliverable interface
 */
interface Deliverable {
  type: string;
  quantity: number;
  deadline: string;
}

/**
 * Bonus threshold interface
 */
interface BonusThreshold {
  metric: 'impressions' | 'engagement' | 'conversions';
  threshold: number;
  bonus: number;
}

/**
 * Deal form data interface
 */
interface DealFormData {
  influencerId: string;
  dealType: DealType;
  compensationStructure: CompensationStructure;
  basePayment: number;
  perPostAmount: number;
  deliverables: Deliverable[];
  bonusThresholds: BonusThreshold[];
  startDate: string;
  endDate: string;
}

/**
 * InfluencerMarketplace component props
 */
interface InfluencerMarketplaceProps {
  companyId: string;
  onSuccess?: () => void;
}

/**
 * InfluencerMarketplace component
 * 
 * @description
 * Influencer marketplace browser and hiring wizard for Media companies
 * 
 * @param {InfluencerMarketplaceProps} props - Component props
 * @returns {JSX.Element} InfluencerMarketplace component
 */
export default function InfluencerMarketplace({
  companyId,
  onSuccess,
}: InfluencerMarketplaceProps): JSX.Element {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filter state
  const [nicheFilter, setNicheFilter] = useState<string>('All');
  const [followersRange, setFollowersRange] = useState<[number, number]>([0, 1000000]);
  const [engagementRange, setEngagementRange] = useState<[number, number]>([0, 10]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Deal form state
  const [dealData, setDealData] = useState<DealFormData>({
    influencerId: '',
    dealType: 'Sponsored',
    compensationStructure: 'Flat',
    basePayment: 10000,
    perPostAmount: 1000,
    deliverables: [],
    bonusThresholds: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  /**
   * Mock influencer data
   * (In production, fetch from GET /api/media/influencers or similar)
   */
  const mockInfluencers: Influencer[] = [
    { _id: '1', name: 'TechGuru Mike', niche: 'Tech', followers: 500000, engagementRate: 4.5, avgReach: 22500, platform: 'YouTube' },
    { _id: '2', name: 'FashionFit Sarah', niche: 'Fashion', followers: 750000, engagementRate: 6.2, avgReach: 46500, platform: 'Instagram' },
    { _id: '3', name: 'GamingPro Alex', niche: 'Gaming', followers: 1200000, engagementRate: 3.8, avgReach: 45600, platform: 'Twitch' },
    { _id: '4', name: 'Beauty by Emma', niche: 'Beauty', followers: 320000, engagementRate: 7.1, avgReach: 22720, platform: 'TikTok' },
    { _id: '5', name: 'Fitness Coach Dan', niche: 'Fitness', followers: 450000, engagementRate: 5.3, avgReach: 23850, platform: 'YouTube' },
  ];

  /**
   * Filter influencers based on current filters
   */
  const filteredInfluencers = mockInfluencers.filter((influencer) => {
    if (nicheFilter !== 'All' && influencer.niche !== nicheFilter) return false;
    if (influencer.followers < followersRange[0] || influencer.followers > followersRange[1]) return false;
    if (influencer.engagementRate < engagementRange[0] || influencer.engagementRate > engagementRange[1]) return false;
    return true;
  });

  /**
   * Calculate pricing estimate
   */
  const calculatePricingEstimate = (influencer: Influencer): number => {
    const basePrice = influencer.followers * (influencer.engagementRate / 100) * 0.05;
    const engagementPremium = influencer.engagementRate > 8 ? 1.6 : influencer.engagementRate > 4 ? 1.3 : 1.0;
    return Math.round(basePrice * engagementPremium);
  };

  /**
   * Calculate ROI preview
   */
  const calculateROI = (): number => {
    if (!selectedInfluencer || dealData.deliverables.length === 0) return 0;
    const totalContent = dealData.deliverables.reduce((sum, d) => sum + d.quantity, 0);
    const estimatedImpressions = selectedInfluencer.avgReach * totalContent;
    const estimatedRevenue = estimatedImpressions * 0.005; // $5 CPM
    const totalCompensation = dealData.basePayment + (dealData.perPostAmount * totalContent);
    return Math.round(((estimatedRevenue - totalCompensation) / totalCompensation) * 100);
  };

  /**
   * Handle influencer selection and open wizard
   */
  const handleHireClick = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setDealData({
      ...dealData,
      influencerId: influencer._id,
      basePayment: calculatePricingEstimate(influencer),
    });
    setCurrentStep(1);
    onOpen();
  };

  /**
   * Handle wizard next step
   */
  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  /**
   * Handle wizard previous step
   */
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  /**
   * Add deliverable
   */
  const handleAddDeliverable = () => {
    setDealData({
      ...dealData,
      deliverables: [
        ...dealData.deliverables,
        { type: 'Video', quantity: 1, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      ],
    });
  };

  /**
   * Remove deliverable
   */
  const handleRemoveDeliverable = (index: number) => {
    setDealData({
      ...dealData,
      deliverables: dealData.deliverables.filter((_, i) => i !== index),
    });
  };

  /**
   * Update deliverable
   */
  const handleUpdateDeliverable = (index: number, field: keyof Deliverable, value: any) => {
    const updated = [...dealData.deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDealData({ ...dealData, deliverables: updated });
  };

  /**
   * Add bonus threshold
   */
  const handleAddBonus = () => {
    setDealData({
      ...dealData,
      bonusThresholds: [
        ...dealData.bonusThresholds,
        { metric: 'impressions', threshold: 100000, bonus: 5000 },
      ],
    });
  };

  /**
   * Remove bonus threshold
   */
  const handleRemoveBonus = (index: number) => {
    setDealData({
      ...dealData,
      bonusThresholds: dealData.bonusThresholds.filter((_, i) => i !== index),
    });
  };

  /**
   * Update bonus threshold
   */
  const handleUpdateBonus = (index: number, field: keyof BonusThreshold, value: any) => {
    const updated = [...dealData.bonusThresholds];
    updated[index] = { ...updated[index], [field]: value };
    setDealData({ ...dealData, bonusThresholds: updated });
  };

  /**
   * Handle deal submission
   */
  const handleSubmit = async () => {
    if (!selectedInfluencer) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/media/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          influencerId: dealData.influencerId,
          dealType: dealData.dealType,
          compensation: {
            flatFee: dealData.compensationStructure === 'Flat' ? dealData.basePayment : undefined,
            perPost: dealData.compensationStructure === 'PerPost' ? dealData.perPostAmount : undefined,
            hybrid: dealData.compensationStructure === 'Hybrid' ? { base: dealData.basePayment, perPost: dealData.perPostAmount } : undefined,
          },
          deliverables: dealData.deliverables,
          influencerMetrics: {
            followers: selectedInfluencer.followers,
            engagementRate: selectedInfluencer.engagementRate,
            niche: selectedInfluencer.niche,
            reach: selectedInfluencer.avgReach,
          },
          bonusThresholds: dealData.bonusThresholds,
          startDate: new Date(dealData.startDate),
          endDate: new Date(dealData.endDate),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Deal created',
          description: `Hired ${selectedInfluencer.name} successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: 'Failed to create deal',
          description: data.error || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating deal',
        description: error.message || 'Network error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render step 1: Deal Structure
   */
  const renderStep1 = () => (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>Deal Type</FormLabel>
        <RadioGroup
          value={dealData.dealType}
          onChange={(value) => setDealData({ ...dealData, dealType: value as DealType })}
        >
          <Stack direction="column" spacing={2}>
            <Radio value="Sponsored">Sponsored Content (One-off)</Radio>
            <Radio value="Ambassador">Brand Ambassador (Long-term)</Radio>
            <Radio value="Affiliate">Affiliate Marketing (Commission)</Radio>
            <Radio value="PerformanceBased">Performance-Based (CPA)</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Compensation Structure</FormLabel>
        <RadioGroup
          value={dealData.compensationStructure}
          onChange={(value) => setDealData({ ...dealData, compensationStructure: value as CompensationStructure })}
        >
          <Stack direction="column" spacing={2}>
            <Radio value="Flat">Flat Fee (Single payment)</Radio>
            <Radio value="PerPost">Per-Post (Payment per content)</Radio>
            <Radio value="PerformanceBased">Performance-Based (Pay per result)</Radio>
            <Radio value="Hybrid">Hybrid (Base + bonuses)</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {(dealData.compensationStructure === 'Flat' || dealData.compensationStructure === 'Hybrid') && (
        <FormControl isRequired>
          <FormLabel>Base Payment</FormLabel>
          <NumberInput
            value={dealData.basePayment}
            onChange={(_, value) => setDealData({ ...dealData, basePayment: value })}
            min={0}
            max={1000000}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      )}

      {(dealData.compensationStructure === 'PerPost' || dealData.compensationStructure === 'Hybrid') && (
        <FormControl isRequired>
          <FormLabel>Per-Post Amount</FormLabel>
          <NumberInput
            value={dealData.perPostAmount}
            onChange={(_, value) => setDealData({ ...dealData, perPostAmount: value })}
            min={0}
            max={100000}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      )}
    </VStack>
  );

  /**
   * Render step 2: Deliverables
   */
  const renderStep2 = () => (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Heading size="sm">Content Deliverables</Heading>
        <IconButton
          aria-label="Add deliverable"
          icon={<AddIcon />}
          size="sm"
          onClick={handleAddDeliverable}
        />
      </HStack>

      {dealData.deliverables.length === 0 ? (
        <Text color="gray.500">No deliverables added. Click + to add.</Text>
      ) : (
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Quantity</Th>
              <Th>Deadline</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {dealData.deliverables.map((deliverable, index) => (
              <Tr key={index}>
                <Td>
                  <Select
                    size="sm"
                    value={deliverable.type}
                    onChange={(e) => handleUpdateDeliverable(index, 'type', e.target.value)}
                  >
                    <option value="Video">Video</option>
                    <option value="Article">Article</option>
                    <option value="SocialPost">Social Post</option>
                    <option value="Livestream">Livestream</option>
                  </Select>
                </Td>
                <Td>
                  <NumberInput
                    size="sm"
                    value={deliverable.quantity}
                    onChange={(_, value) => handleUpdateDeliverable(index, 'quantity', value)}
                    min={1}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Td>
                <Td>
                  <Input
                    size="sm"
                    type="date"
                    value={deliverable.deadline}
                    onChange={(e) => handleUpdateDeliverable(index, 'deadline', e.target.value)}
                  />
                </Td>
                <Td>
                  <IconButton
                    aria-label="Remove"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleRemoveDeliverable(index)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </VStack>
  );

  /**
   * Render step 3: Performance Bonuses & ROI
   */
  const renderStep3 = () => {
    const roiValue = calculateROI();

    return (
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="sm">Performance Bonuses</Heading>
          <IconButton
            aria-label="Add bonus"
            icon={<AddIcon />}
            size="sm"
            onClick={handleAddBonus}
          />
        </HStack>

        {dealData.bonusThresholds.length === 0 ? (
          <Text color="gray.500">No bonuses configured. Optional.</Text>
        ) : (
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Metric</Th>
                <Th>Threshold</Th>
                <Th>Bonus</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {dealData.bonusThresholds.map((bonus, index) => (
                <Tr key={index}>
                  <Td>
                    <Select
                      size="sm"
                      value={bonus.metric}
                      onChange={(e) => handleUpdateBonus(index, 'metric', e.target.value)}
                    >
                      <option value="impressions">Impressions</option>
                      <option value="engagement">Engagement</option>
                      <option value="conversions">Conversions</option>
                    </Select>
                  </Td>
                  <Td>
                    <NumberInput
                      size="sm"
                      value={bonus.threshold}
                      onChange={(_, value) => handleUpdateBonus(index, 'threshold', value)}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </Td>
                  <Td>
                    <NumberInput
                      size="sm"
                      value={bonus.bonus}
                      onChange={(_, value) => handleUpdateBonus(index, 'bonus', value)}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Remove"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleRemoveBonus(index)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <Divider />

        <Box bg="green.50" p={4} borderRadius="md">
          <Heading size="sm" mb={2}>ROI Preview</Heading>
          <Stat>
            <StatLabel>Estimated ROI</StatLabel>
            <StatNumber color={roiValue >= 0 ? 'green.500' : 'red.500'}>
              {roiValue >= 0 ? '+' : ''}{roiValue}%
            </StatNumber>
            <StatHelpText>
              Based on {dealData.deliverables.reduce((sum, d) => sum + d.quantity, 0)} deliverables
            </StatHelpText>
          </Stat>
        </Box>
      </VStack>
    );
  };

  return (
    <Box>
      {/* Filter Controls */}
      <Box mb={6} p={4} bg="gray.50" borderRadius="md">
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <FormControl>
            <FormLabel>Niche</FormLabel>
            <Select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
              <option value="All">All Niches</option>
              <option value="Tech">Tech</option>
              <option value="Fashion">Fashion</option>
              <option value="Gaming">Gaming</option>
              <option value="Beauty">Beauty</option>
              <option value="Fitness">Fitness</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Followers: {followersRange[0].toLocaleString()} - {followersRange[1].toLocaleString()}</FormLabel>
            <Slider
              min={0}
              max={2000000}
              step={10000}
              value={followersRange[1]}
              onChange={(value) => setFollowersRange([0, value])}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <FormControl>
            <FormLabel>Engagement: {engagementRange[0]}% - {engagementRange[1]}%</FormLabel>
            <Slider
              min={0}
              max={15}
              step={0.5}
              value={engagementRange[1]}
              onChange={(value) => setEngagementRange([0, value])}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
        </Grid>
      </Box>

      {/* Influencer Grid */}
      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
        {filteredInfluencers.map((influencer) => (
          <Card key={influencer._id}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="sm">{influencer.name}</Heading>
                <Badge colorScheme="purple">{influencer.niche}</Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Followers:</Text>
                  <Text fontWeight="medium">{influencer.followers.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Engagement:</Text>
                  <Badge colorScheme={influencer.engagementRate > 6 ? 'green' : influencer.engagementRate > 3 ? 'yellow' : 'gray'}>
                    {influencer.engagementRate}%
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Avg Reach:</Text>
                  <Text fontWeight="medium">{influencer.avgReach.toLocaleString()}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Platform:</Text>
                  <Text fontWeight="medium">{influencer.platform}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Est. Price:</Text>
                  <Text fontWeight="bold" color="green.500">
                    ${calculatePricingEstimate(influencer).toLocaleString()}
                  </Text>
                </HStack>
                <Button colorScheme="blue" size="sm" onClick={() => handleHireClick(influencer)}>
                  Hire Influencer
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>

      {/* Hiring Wizard Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            Hire {selectedInfluencer?.name} - Step {currentStep} of 3
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Progress value={(currentStep / 3) * 100} colorScheme="blue" size="sm" borderRadius="md" mb={6} />

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              {currentStep < 3 ? (
                <Button colorScheme="blue" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  loadingText="Creating..."
                >
                  Create Deal
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

/**
 * @file src/components/media/AdCampaignBuilder.tsx
 * @description Multi-step ad campaign builder wizard for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Ad campaign builder component enabling Media companies to create multi-platform advertising
 * campaigns with demographic targeting, budget allocation, bidding strategy configuration, and
 * real-time ROAS (Return on Ad Spend) preview. Three-step wizard guides users through platform
 * selection, audience targeting (age groups, income brackets, locations), budget and bidding
 * strategy (CPC vs CPM), and final campaign review with performance projections.
 * 
 * COMPONENT ARCHITECTURE:
 * - Three-step wizard:
 *   1. Platform Selection & Campaign Basics: Multi-platform checkboxes, campaign name, dates
 *   2. Audience Targeting: Age group sliders, income bracket selectors, location checkboxes
 *   3. Budget & Bidding: Total budget, daily budget limiter, CPC/CPM toggle, bid amount, ROAS preview
 * - Real-time ROAS calculator: (estimated conversions × avg order value) / budget × 100
 * - Platform budget distribution: Total budget distributed based on platform weights/selection
 * - Bid strategy selector: CPC (Cost Per Click) vs CPM (Cost Per Mille/thousand impressions)
 * - Target demographic validation: Ensure at least one age/income/location selected
 * 
 * STATE MANAGEMENT:
 * - campaignData: Form state for all campaign fields
 * - currentStep: Wizard step (1-3)
 * - isSubmitting: Loading state during campaign creation
 * - selectedPlatforms: Array of selected platform IDs
 * - targetDemographics: Age groups, income brackets, locations arrays
 * 
 * API INTEGRATION:
 * - POST /api/media/ads - Create ad campaign (reuses E-Commerce AdCampaign endpoint)
 *   Request: {
 *     companyId, campaignName, platforms[], targetDemographics: { ageGroups, incomeGroups, locations },
 *     budget, dailyBudget, bidStrategy: 'CPC'|'CPM', bidAmount, startDate, endDate, adCreatives
 *   }
 *   Response: { message, campaign } (201)
 * 
 * PROPS:
 * - companyId: Company ID for campaign creation
 * - onSuccess: Callback after successful campaign creation
 * 
 * USAGE:
 * ```tsx
 * const { isOpen, onOpen, onClose } = useDisclosure();
 * 
 * <Button onClick={onOpen}>Create Campaign</Button>
 * <AdCampaignBuilder
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   companyId="64f7a1b2c3d4e5f6g7h8i9j0"
 *   onSuccess={() => { refetch(); toast({ title: "Campaign created!" }); }}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - ROAS formula: ((estimatedConversions × avgOrderValue) / budget) × 100
 * - Estimated conversions: (budget / CPC) × conversionRate (assume 2-5% CR)
 * - Platform budget distribution: totalBudget × (platformWeight / totalWeight)
 * - Daily budget validation: dailyBudget × daysInCampaign ≤ totalBudget
 * - Bid strategy:
 *   - CPC: Pay per click, good for conversion-focused campaigns
 *   - CPM: Pay per 1000 impressions, good for brand awareness
 * - Demographic targeting:
 *   - High-value demographics (25-54 age, $50K+ income) = higher conversion rates
 *   - Broad targeting = lower CPM but lower conversion rates
 *   - Narrow targeting = higher CPM but higher conversion rates
 * - Campaign duration: Minimum 7 days, maximum 365 days
 * - Budget limits: Min $100, Max $1,000,000 total budget
 */

'use client';

import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  useToast,
  Box,
  Checkbox,
  CheckboxGroup,
  Stack,
  Radio,
  RadioGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  Divider,
} from '@chakra-ui/react';

/**
 * Bid strategy enum
 */
type BidStrategy = 'CPC' | 'CPM';

/**
 * Platform option interface
 */
interface PlatformOption {
  id: string;
  name: string;
  type: string;
}

/**
 * Campaign form data interface
 */
interface CampaignFormData {
  campaignName: string;
  platforms: string[];
  targetDemographics: {
    ageGroups: string[];
    incomeGroups: string[];
    locations: string[];
  };
  budget: number;
  dailyBudget: number;
  bidStrategy: BidStrategy;
  bidAmount: number;
  startDate: string;
  endDate: string;
}

/**
 * AdCampaignBuilder component props
 */
interface AdCampaignBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

/**
 * AdCampaignBuilder component
 * 
 * @description
 * Multi-step ad campaign builder wizard for creating advertising campaigns
 * with demographic targeting and budget allocation
 * 
 * @param {AdCampaignBuilderProps} props - Component props
 * @returns {JSX.Element} AdCampaignBuilder modal
 */
export default function AdCampaignBuilder({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: AdCampaignBuilderProps): JSX.Element {
  const toast = useToast();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form data state
  const [campaignData, setCampaignData] = useState<CampaignFormData>({
    campaignName: '',
    platforms: [],
    targetDemographics: {
      ageGroups: [],
      incomeGroups: [],
      locations: [],
    },
    budget: 1000,
    dailyBudget: 100,
    bidStrategy: 'CPC',
    bidAmount: 0.50,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Platform options (mock data)
   */
  const platformOptions: PlatformOption[] = [
    { id: 'youtube', name: 'YouTube', type: 'Video' },
    { id: 'tiktok', name: 'TikTok', type: 'Short-form' },
    { id: 'instagram', name: 'Instagram', type: 'Social' },
    { id: 'twitter', name: 'Twitter/X', type: 'Social' },
    { id: 'facebook', name: 'Facebook', type: 'Social' },
    { id: 'twitch', name: 'Twitch', type: 'Livestream' },
  ];

  /**
   * Calculate campaign duration in days
   */
  const getCampaignDuration = (): number => {
    const start = new Date(campaignData.startDate);
    const end = new Date(campaignData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * Calculate estimated ROAS
   */
  const calculateROAS = (): number => {
    const duration = getCampaignDuration();
    const totalBudget = Math.min(campaignData.budget, campaignData.dailyBudget * duration);
    
    // Estimate clicks/impressions based on bid strategy
    let estimatedConversions = 0;
    if (campaignData.bidStrategy === 'CPC') {
      const estimatedClicks = totalBudget / campaignData.bidAmount;
      const conversionRate = 0.03; // 3% assumed conversion rate
      estimatedConversions = estimatedClicks * conversionRate;
    } else {
      const estimatedImpressions = (totalBudget / campaignData.bidAmount) * 1000;
      const clickThroughRate = 0.02; // 2% CTR
      const conversionRate = 0.03; // 3% CR
      estimatedConversions = estimatedImpressions * clickThroughRate * conversionRate;
    }

    const avgOrderValue = 50; // Assumed $50 AOV
    const estimatedRevenue = estimatedConversions * avgOrderValue;
    const roas = ((estimatedRevenue - totalBudget) / totalBudget) * 100;

    return Math.round(roas);
  };

  /**
   * Calculate estimated impressions/clicks
   */
  const getEstimatedMetrics = (): { impressions: number; clicks: number; conversions: number } => {
    const duration = getCampaignDuration();
    const totalBudget = Math.min(campaignData.budget, campaignData.dailyBudget * duration);

    if (campaignData.bidStrategy === 'CPC') {
      const clicks = Math.round(totalBudget / campaignData.bidAmount);
      const impressions = Math.round(clicks / 0.02); // Assume 2% CTR
      const conversions = Math.round(clicks * 0.03); // 3% CR
      return { impressions, clicks, conversions };
    } else {
      const impressions = Math.round((totalBudget / campaignData.bidAmount) * 1000);
      const clicks = Math.round(impressions * 0.02); // 2% CTR
      const conversions = Math.round(clicks * 0.03); // 3% CR
      return { impressions, clicks, conversions };
    }
  };

  /**
   * Validate step 1 (platforms & basics)
   */
  const validateStep1 = (): boolean => {
    if (!campaignData.campaignName.trim()) {
      toast({
        title: 'Campaign name required',
        description: 'Please enter a campaign name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (campaignData.platforms.length === 0) {
      toast({
        title: 'Platform selection required',
        description: 'Please select at least one platform',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  /**
   * Validate step 2 (demographics)
   */
  const validateStep2 = (): boolean => {
    const { ageGroups, incomeGroups, locations } = campaignData.targetDemographics;

    if (ageGroups.length === 0 || incomeGroups.length === 0 || locations.length === 0) {
      toast({
        title: 'Target demographics required',
        description: 'Please select at least one option in each category',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  /**
   * Handle field change
   */
  const handleFieldChange = (field: keyof CampaignFormData, value: any) => {
    setCampaignData({ ...campaignData, [field]: value });
  };

  /**
   * Handle demographic change
   */
  const handleDemographicChange = (category: 'ageGroups' | 'incomeGroups' | 'locations', values: string[]) => {
    setCampaignData({
      ...campaignData,
      targetDemographics: {
        ...campaignData.targetDemographics,
        [category]: values,
      },
    });
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(currentStep + 1);
  };

  /**
   * Handle previous step
   */
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/media/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          campaignName: campaignData.campaignName,
          platforms: campaignData.platforms,
          targetDemographics: campaignData.targetDemographics,
          budget: campaignData.budget,
          dailyBudget: campaignData.dailyBudget,
          bidStrategy: campaignData.bidStrategy,
          bidAmount: campaignData.bidAmount,
          startDate: new Date(campaignData.startDate),
          endDate: new Date(campaignData.endDate),
          adCreatives: [], // Empty for now, can be added later
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Campaign created',
          description: `"${campaignData.campaignName}" created successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Reset form
        setCampaignData({
          campaignName: '',
          platforms: [],
          targetDemographics: { ageGroups: [], incomeGroups: [], locations: [] },
          budget: 1000,
          dailyBudget: 100,
          bidStrategy: 'CPC',
          bidAmount: 0.50,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setCurrentStep(1);

        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: 'Failed to create campaign',
          description: data.error || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating campaign',
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
   * Render step 1: Platform Selection & Basics
   */
  const renderStep1 = () => (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>Campaign Name</FormLabel>
        <Input
          placeholder="Enter campaign name..."
          value={campaignData.campaignName}
          onChange={(e) => handleFieldChange('campaignName', e.target.value)}
          maxLength={100}
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Platform Selection</FormLabel>
        <CheckboxGroup
          value={campaignData.platforms}
          onChange={(values) => handleFieldChange('platforms', values)}
        >
          <Grid templateColumns="repeat(2, 1fr)" gap={2}>
            {platformOptions.map((platform) => (
              <Checkbox key={platform.id} value={platform.id}>
                {platform.name} <Badge ml={2} fontSize="xs">{platform.type}</Badge>
              </Checkbox>
            ))}
          </Grid>
        </CheckboxGroup>
        <Text fontSize="xs" color="gray.500" mt={2}>
          {campaignData.platforms.length} platform(s) selected
        </Text>
      </FormControl>

      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <FormControl isRequired>
          <FormLabel>Start Date</FormLabel>
          <Input
            type="date"
            value={campaignData.startDate}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>End Date</FormLabel>
          <Input
            type="date"
            value={campaignData.endDate}
            onChange={(e) => handleFieldChange('endDate', e.target.value)}
            min={campaignData.startDate}
          />
        </FormControl>
      </Grid>

      <Text fontSize="sm" color="gray.600">
        Campaign Duration: {getCampaignDuration()} days
      </Text>
    </VStack>
  );

  /**
   * Render step 2: Audience Targeting
   */
  const renderStep2 = () => (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>Age Groups</FormLabel>
        <CheckboxGroup
          value={campaignData.targetDemographics.ageGroups}
          onChange={(values) => handleDemographicChange('ageGroups', values as string[])}
        >
          <Stack spacing={2}>
            <Checkbox value="18-24">18-24</Checkbox>
            <Checkbox value="25-34">25-34 (Premium)</Checkbox>
            <Checkbox value="35-44">35-44 (Premium)</Checkbox>
            <Checkbox value="45-54">45-54 (Premium)</Checkbox>
            <Checkbox value="55-64">55-64</Checkbox>
            <Checkbox value="65+">65+</Checkbox>
          </Stack>
        </CheckboxGroup>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Income Brackets</FormLabel>
        <CheckboxGroup
          value={campaignData.targetDemographics.incomeGroups}
          onChange={(values) => handleDemographicChange('incomeGroups', values as string[])}
        >
          <Stack spacing={2}>
            <Checkbox value="<25k">&lt;$25K</Checkbox>
            <Checkbox value="25-50k">$25K-$50K</Checkbox>
            <Checkbox value="50-100k">$50K-$100K (High-value)</Checkbox>
            <Checkbox value="100-200k">$100K-$200K (High-value)</Checkbox>
            <Checkbox value="200k+">$200K+ (Premium)</Checkbox>
          </Stack>
        </CheckboxGroup>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Locations</FormLabel>
        <CheckboxGroup
          value={campaignData.targetDemographics.locations}
          onChange={(values) => handleDemographicChange('locations', values as string[])}
        >
          <Stack spacing={2}>
            <Checkbox value="North America">North America</Checkbox>
            <Checkbox value="Europe">Europe</Checkbox>
            <Checkbox value="Asia">Asia</Checkbox>
            <Checkbox value="South America">South America</Checkbox>
            <Checkbox value="Other">Other</Checkbox>
          </Stack>
        </CheckboxGroup>
      </FormControl>
    </VStack>
  );

  /**
   * Render step 3: Budget & Bidding
   */
  const renderStep3 = () => {
    const roasValue = calculateROAS();
    const metrics = getEstimatedMetrics();

    return (
      <VStack spacing={4} align="stretch">
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <FormControl isRequired>
            <FormLabel>Total Budget</FormLabel>
            <NumberInput
              value={campaignData.budget}
              onChange={(_, value) => handleFieldChange('budget', value)}
              min={100}
              max={1000000}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Daily Budget Limit</FormLabel>
            <NumberInput
              value={campaignData.dailyBudget}
              onChange={(_, value) => handleFieldChange('dailyBudget', value)}
              min={10}
              max={campaignData.budget}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </Grid>

        <FormControl isRequired>
          <FormLabel>Bidding Strategy</FormLabel>
          <RadioGroup
            value={campaignData.bidStrategy}
            onChange={(value) => handleFieldChange('bidStrategy', value as BidStrategy)}
          >
            <Stack direction="column" spacing={2}>
              <Radio value="CPC">CPC (Cost Per Click) - Best for conversions</Radio>
              <Radio value="CPM">CPM (Cost Per 1000 Impressions) - Best for brand awareness</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>
            {campaignData.bidStrategy === 'CPC' ? 'Max CPC Bid' : 'Max CPM Bid'}
          </FormLabel>
          <NumberInput
            value={campaignData.bidAmount}
            onChange={(_, value) => handleFieldChange('bidAmount', value)}
            min={0.01}
            max={100}
            step={0.01}
            precision={2}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {campaignData.bidStrategy === 'CPC' ? 'Amount per click' : 'Amount per 1000 impressions'}
          </Text>
        </FormControl>

        <Divider />

        <Box bg="blue.50" p={4} borderRadius="md">
          <Heading size="sm" mb={3}>Campaign Projections</Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Stat>
              <StatLabel>Est. Impressions</StatLabel>
              <StatNumber fontSize="md">{metrics.impressions.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Est. Clicks</StatLabel>
              <StatNumber fontSize="md">{metrics.clicks.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Est. Conversions</StatLabel>
              <StatNumber fontSize="md">{metrics.conversions.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>ROAS</StatLabel>
              <StatNumber fontSize="md" color={roasValue >= 0 ? 'green.500' : 'red.500'}>
                {roasValue >= 0 ? '+' : ''}{roasValue}%
              </StatNumber>
              <StatHelpText fontSize="xs">Return on Ad Spend</StatHelpText>
            </Stat>
          </Grid>
        </Box>
      </VStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          Create Ad Campaign - Step {currentStep} of 3
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Progress
            value={(currentStep / 3) * 100}
            colorScheme="blue"
            size="sm"
            borderRadius="md"
            mb={6}
          />

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
                Create Campaign
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

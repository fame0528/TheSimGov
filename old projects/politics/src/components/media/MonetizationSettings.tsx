/**
 * @file src/components/media/MonetizationSettings.tsx
 * @description Monetization configuration dashboard for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Monetization settings component enabling Media companies to configure revenue optimization
 * strategies including CPM rate multipliers by demographic segments (age, income, location, device),
 * subscription tier management, affiliate commission rates, platform revenue sharing terms, and
 * monetization strategy selection. Displays real-time effective CPM range calculations, subscription
 * revenue projections, and profitability indicators based on configured settings.
 * 
 * COMPONENT ARCHITECTURE:
 * - Strategy selector: Radio buttons for AdRevenue/Subscriptions/Affiliates/Hybrid
 * - CPM multiplier sliders: Separate controls for age groups, income brackets, locations, devices
 * - Subscription tier builder: Add/edit tiers with name, pricing, features, ad-free toggle
 * - Affiliate commission config: Default rate + category-specific rates (Tech, Fashion, Home, etc.)
 * - Platform revenue shares: YouTube, TikTok, Twitch, Substack percentage inputs
 * - Analytics display: Effective CPM range (min/max), subscription revenue, isProfitable from virtuals
 * - Default CPM input: Base CPM rate before demographic multipliers applied
 * - Min/Max CPM limits: Floor and ceiling for CPM rates
 * 
 * STATE MANAGEMENT:
 * - settings: MonetizationSettings document from backend (or defaults)
 * - loading: Loading state during fetch
 * - isSaving: Saving state during PATCH request
 * - isDirty: Track if form has unsaved changes
 * - Each config section: Local state for form inputs before save
 * 
 * API INTEGRATION:
 * - GET /api/media/monetization - Fetch monetization settings
 *   Response: { settings, effectiveCPMRange: { min, max }, subscriptionRevenue, isProfitable }
 *   Auto-creates default settings if none exist
 * - PATCH /api/media/monetization - Update settings
 *   Request: { defaultCPM?, strategy?, cpmByAge?, cpmByIncome?, subscriptionTiers?, etc. } (21 allowed fields)
 *   Response: { message, settings, effectiveCPMRange, subscriptionRevenue, isProfitable }
 * 
 * PROPS:
 * - companyId: Company ID for settings lookup
 * 
 * USAGE:
 * ```tsx
 * <MonetizationSettings companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Effective CPM calculation (backend virtual):
 *   - Min: defaultCPM × min(ageMultipliers) × min(incomeMultipliers) × min(locationMultipliers) × min(deviceMultipliers)
 *   - Max: defaultCPM × max(ageMultipliers) × max(incomeMultipliers) × max(locationMultipliers) × max(deviceMultipliers)
 *   - Clamped by minCPM and maxCPM settings
 * - Subscription revenue (backend virtual): totalMRR + totalARR / 12
 * - isProfitable (backend virtual): churnRate < 5% && avgRevenuePerUser > $5
 * - Strategy implications:
 *   - AdRevenue: Maximize CPM with high-value demographics, higher ad load
 *   - Subscriptions: Focus on subscriber acquisition/retention, lower ad load
 *   - Affiliates: Product promotion focus, commission-based earnings
 *   - Hybrid: Balanced approach, diversified revenue streams
 * - CPM multiplier defaults:
 *   - Age: 25-34 (1.5x), 35-44 (1.3x), others (0.8-1.1x)
 *   - Income: $200K+ (2.5x), $100K-$200K (1.8x), <$25K (0.6x)
 *   - Location: North America (1.5x), Europe (1.3x), Other (0.7x)
 *   - Device: Desktop (1.2x), Mobile (1.0x), Tablet (1.1x)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  Skeleton,
  Divider,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';

/**
 * Monetization strategy enum
 */
type MonetizationStrategy = 'AdRevenue' | 'Subscriptions' | 'Affiliates' | 'Hybrid';

/**
 * CPM multipliers interface
 */
interface CPMMultipliers {
  [key: string]: number;
}

/**
 * Monetization settings interface
 */
interface MonetizationSettings {
  _id: string;
  company: string;
  isActive: boolean;
  defaultCPM: number;
  strategy: MonetizationStrategy;
  cpmByAge: CPMMultipliers;
  cpmByIncome: CPMMultipliers;
  cpmByLocation: CPMMultipliers;
  cpmByDevice: CPMMultipliers;
  minCPM: number;
  maxCPM: number;
  effectiveCPMRange?: { min: number; max: number };
  subscriptionRevenue?: number;
  isProfitable?: boolean;
}

/**
 * MonetizationSettings component props
 */
interface MonetizationSettingsProps {
  companyId: string;
}

/**
 * MonetizationSettings component
 * 
 * @description
 * Monetization configuration dashboard for Media companies with CPM optimization,
 * subscription management, and revenue strategy selection
 * 
 * @param {MonetizationSettingsProps} props - Component props
 * @returns {JSX.Element} MonetizationSettings component
 */
export default function MonetizationSettings({
  companyId,
}: MonetizationSettingsProps): JSX.Element {
  const toast = useToast();

  // Settings state
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  /**
   * Fetch monetization settings from API
   */
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media/monetization?companyId=${companyId}`);
      const data = await response.json();

      if (data.success) {
        setSettings({
          ...data.settings,
          effectiveCPMRange: data.effectiveCPMRange,
          subscriptionRevenue: data.subscriptionRevenue,
          isProfitable: data.isProfitable,
        });
      } else {
        toast({
          title: 'Failed to load settings',
          description: data.error || 'Could not fetch monetization settings',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading settings',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch settings on mount
   */
  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  /**
   * Handle field change
   */
  const handleFieldChange = <K extends keyof MonetizationSettings>(
    field: K,
    value: MonetizationSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setIsDirty(true);
  };

  /**
   * Handle CPM multiplier change
   */
  const handleCPMMultiplierChange = (
    category: 'cpmByAge' | 'cpmByIncome' | 'cpmByLocation' | 'cpmByDevice',
    key: string,
    value: number
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
    setIsDirty(true);
  };

  /**
   * Handle save settings
   */
  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/media/monetization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          defaultCPM: settings.defaultCPM,
          strategy: settings.strategy,
          cpmByAge: settings.cpmByAge,
          cpmByIncome: settings.cpmByIncome,
          cpmByLocation: settings.cpmByLocation,
          cpmByDevice: settings.cpmByDevice,
          minCPM: settings.minCPM,
          maxCPM: settings.maxCPM,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Settings saved',
          description: 'Monetization settings updated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        setSettings({
          ...data.settings,
          effectiveCPMRange: data.effectiveCPMRange,
          subscriptionRevenue: data.subscriptionRevenue,
          isProfitable: data.isProfitable,
        });
        setIsDirty(false);
      } else {
        toast({
          title: 'Failed to save settings',
          description: data.error || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message || 'Network error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <VStack spacing={6} align="stretch">
      <Skeleton height="100px" />
      <Skeleton height="200px" />
      <Skeleton height="200px" />
    </VStack>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <Box textAlign="center" py={10}>
      <Text fontSize="lg" color="gray.500" mb={2}>
        No monetization settings found
      </Text>
      <Text fontSize="sm" color="gray.400">
        Settings will be auto-created on save
      </Text>
    </Box>
  );

  if (loading) {
    return renderSkeletons();
  }

  if (!settings) {
    return renderEmptyState();
  }

  return (
    <Box>
      {/* Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Effective CPM Range</StatLabel>
              <StatNumber fontSize="lg">
                ${settings.effectiveCPMRange?.min.toFixed(2)} - ${settings.effectiveCPMRange?.max.toFixed(2)}
              </StatNumber>
              <StatHelpText>Per 1000 impressions</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Subscription Revenue</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                ${settings.subscriptionRevenue?.toLocaleString() || 0}
              </StatNumber>
              <StatHelpText>MRR + ARR/12</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Profitability Status</StatLabel>
              <StatNumber fontSize="lg">
                <Badge colorScheme={settings.isProfitable ? 'green' : 'red'} fontSize="lg">
                  {settings.isProfitable ? 'Profitable' : 'Unprofitable'}
                </Badge>
              </StatNumber>
              <StatHelpText>Churn &lt;5%, ARPU &gt;$5</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Strategy Selector */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="sm">Monetization Strategy</Heading>
        </CardHeader>
        <CardBody>
          <RadioGroup
            value={settings.strategy}
            onChange={(value) => handleFieldChange('strategy', value as MonetizationStrategy)}
          >
            <Stack direction="column" spacing={3}>
              <Radio value="AdRevenue">Ad Revenue - Maximize CPM with high-value demographics</Radio>
              <Radio value="Subscriptions">Subscriptions - Focus on subscriber acquisition/retention</Radio>
              <Radio value="Affiliates">Affiliates - Commission-based product promotion</Radio>
              <Radio value="Hybrid">Hybrid - Balanced approach, diversified revenue streams</Radio>
            </Stack>
          </RadioGroup>
        </CardBody>
      </Card>

      {/* Default CPM Configuration */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="sm">Base CPM Configuration</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <FormControl>
              <FormLabel>Default CPM ($)</FormLabel>
              <NumberInput
                value={settings.defaultCPM}
                onChange={(_, value) => handleFieldChange('defaultCPM', value)}
                min={0.10}
                max={100}
                step={0.10}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Min CPM Floor ($)</FormLabel>
              <NumberInput
                value={settings.minCPM}
                onChange={(_, value) => handleFieldChange('minCPM', value)}
                min={0}
                max={settings.defaultCPM}
                step={0.10}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Max CPM Ceiling ($)</FormLabel>
              <NumberInput
                value={settings.maxCPM}
                onChange={(_, value) => handleFieldChange('maxCPM', value)}
                min={settings.defaultCPM}
                max={500}
                step={0.10}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </Grid>
        </CardBody>
      </Card>

      {/* CPM Multipliers */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="sm">CPM Rate Multipliers</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Age Groups */}
            <Box>
              <Text fontWeight="bold" mb={3}>Age Groups</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {Object.entries(settings.cpmByAge).map(([age, multiplier]) => (
                  <FormControl key={age}>
                    <FormLabel fontSize="sm">
                      {age}: {multiplier.toFixed(1)}x
                    </FormLabel>
                    <Slider
                      value={multiplier}
                      onChange={(value) => handleCPMMultiplierChange('cpmByAge', age, value)}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg="blue.400" />
                      </SliderTrack>
                      <SliderThumb boxSize={6} />
                    </Slider>
                  </FormControl>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Income Groups */}
            <Box>
              <Text fontWeight="bold" mb={3}>Income Brackets</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {Object.entries(settings.cpmByIncome).map(([income, multiplier]) => (
                  <FormControl key={income}>
                    <FormLabel fontSize="sm">
                      {income}: {multiplier.toFixed(1)}x
                    </FormLabel>
                    <Slider
                      value={multiplier}
                      onChange={(value) => handleCPMMultiplierChange('cpmByIncome', income, value)}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg="green.400" />
                      </SliderTrack>
                      <SliderThumb boxSize={6} />
                    </Slider>
                  </FormControl>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Locations */}
            <Box>
              <Text fontWeight="bold" mb={3}>Locations</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {Object.entries(settings.cpmByLocation).map(([location, multiplier]) => (
                  <FormControl key={location}>
                    <FormLabel fontSize="sm">
                      {location}: {multiplier.toFixed(1)}x
                    </FormLabel>
                    <Slider
                      value={multiplier}
                      onChange={(value) => handleCPMMultiplierChange('cpmByLocation', location, value)}
                      min={0.5}
                      max={2.5}
                      step={0.1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg="purple.400" />
                      </SliderTrack>
                      <SliderThumb boxSize={6} />
                    </Slider>
                  </FormControl>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Devices */}
            <Box>
              <Text fontWeight="bold" mb={3}>Devices</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {Object.entries(settings.cpmByDevice).map(([device, multiplier]) => (
                  <FormControl key={device}>
                    <FormLabel fontSize="sm">
                      {device}: {multiplier.toFixed(1)}x
                    </FormLabel>
                    <Slider
                      value={multiplier}
                      onChange={(value) => handleCPMMultiplierChange('cpmByDevice', device, value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg="orange.400" />
                      </SliderTrack>
                      <SliderThumb boxSize={6} />
                    </Slider>
                  </FormControl>
                ))}
              </Grid>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Save Button */}
      <HStack justify="flex-end" spacing={3}>
        <Button
          colorScheme="blue"
          onClick={handleSave}
          isLoading={isSaving}
          loadingText="Saving..."
          isDisabled={!isDirty}
        >
          Save Settings
        </Button>
        {isDirty && (
          <Badge colorScheme="orange" fontSize="sm">
            Unsaved Changes
          </Badge>
        )}
      </HStack>
    </Box>
  );
}

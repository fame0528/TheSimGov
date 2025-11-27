/**
 * @file src/components/media/AudienceAnalytics.tsx
 * @description Audience demographics and engagement analytics dashboard
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Comprehensive audience analytics dashboard displaying demographic breakdowns (age, income,
 * location, political alignment), growth trends with line charts, churn rate tracking,
 * engagement metrics (avg views per follower, interaction rate, loyal followers %), and
 * audience health scoring. Provides visual insights into audience quality for monetization
 * optimization (high-value demographics command higher CPM rates) and retention strategies.
 * 
 * COMPONENT ARCHITECTURE:
 * - Stats overview: Total followers, growth rate, churn rate, health score
 * - Demographics section: Age groups, income groups, geographic, political breakdowns
 * - Growth trends: Monthly growth chart with net growth visualization
 * - Engagement metrics: Views per follower, interaction rate, retention
 * - Health scoring: Engagement health, growth health, demographic health
 * - Advertiser appeal: Overall score for ad revenue potential
 * 
 * STATE MANAGEMENT:
 * - audience: IAudience document from backend
 * - loading: Loading state during fetch
 * - selectedTab: Demographics/Growth/Engagement tab switching
 * 
 * API INTEGRATION:
 * - GET /api/media/audience - Fetch audience data
 * - GET /api/media/audience/growth - Growth trends over time
 * - GET /api/media/audience/demographics - Demographic breakdowns
 * - GET /api/media/audience/retention - Retention metrics
 * 
 * PROPS:
 * - companyId: Company ID for audience filtering
 * 
 * USAGE:
 * ```tsx
 * <AudienceAnalytics companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Health score formula: (engagementHealth × 0.4 + growthHealth × 0.3 + demographicHealth × 0.3)
 * - High-value demographics: 25-54 age, $50k+ income (2-3x higher CPM)
 * - Churn rate healthy: <5%, concerning: 8-12%, critical: >15%
 * - Growth rate sustainable: 5-10%/mo, excellent: >15%/mo
 * - Loyal followers: >10 interactions/month (worth 5x avg CPM)
 * - Demographic breakdowns shown as percentage bars with color coding
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Skeleton,
  Divider,
} from '@chakra-ui/react';

/**
 * Audience interface (from backend)
 */
interface Audience {
  _id: string;
  company: string;
  totalFollowers: number;
  activeFollowers: number;
  monthlyGrowth: number;
  monthlyChurn: number;
  growthRate: number;
  churnRate: number;

  // Demographics
  ageGroups: {
    '13-17': number;
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55-64': number;
    '65+': number;
  };
  incomeGroups: {
    '<25k': number;
    '25-50k': number;
    '50-75k': number;
    '75-100k': number;
    '100-150k': number;
    '>150k': number;
  };
  geographicBreakdown: {
    Local: number;
    Regional: number;
    National: number;
    International: number;
  };
  politicalAlignment: {
    Left: number;
    Center: number;
    Right: number;
    Nonpartisan: number;
  };
  genderBreakdown: {
    Male: number;
    Female: number;
    Other: number;
  };

  // Engagement
  avgViewsPerFollower: number;
  avgWatchTime: number;
  avgInteractionRate: number;
  avgSharesPerFollower: number;
  avgCommentsPerFollower: number;
  repeatVisitorRate: number;
  loyalFollowerPercent: number;

  // Retention
  retentionRate: number;
  avgFollowerLifetime: number;
  lifetimeValuePerFollower: number;

  // Health
  healthScore: number;
  engagementHealth: number;
  growthHealth: number;
  demographicHealth: number;
  brandSafetyScore: number;

  // Virtuals
  netGrowth: number;
  monthlyGrowthPercent: number;
  highValueFollowerPercent: number;
  advertiserAppealScore: number;
}

/**
 * AudienceAnalytics component props
 */
interface AudienceAnalyticsProps {
  companyId: string;
}

/**
 * AudienceAnalytics component
 * 
 * @description
 * Comprehensive audience analytics dashboard with demographics, growth trends,
 * engagement metrics, and health scoring
 * 
 * @param {AudienceAnalyticsProps} props - Component props
 * @returns {JSX.Element} AudienceAnalytics dashboard
 */
export default function AudienceAnalytics({
  companyId,
}: AudienceAnalyticsProps): JSX.Element {
  const toast = useToast();

  // Audience state
  const [audience, setAudience] = useState<Audience | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetch audience data from API
   */
  const fetchAudience = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media/audience?companyId=${companyId}`);
      const data = await response.json();

      if (data.success) {
        setAudience(data.audience);
      } else {
        toast({
          title: 'Failed to load audience',
          description: data.error || 'Could not fetch audience data',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading audience',
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
   * Fetch audience on mount
   */
  useEffect(() => {
    fetchAudience();
  }, [companyId]);

  /**
   * Get health badge color
   */
  const getHealthBadgeColor = (score: number): string => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  /**
   * Get churn badge color
   */
  const getChurnBadgeColor = (rate: number): string => {
    if (rate < 5) return 'green';
    if (rate < 12) return 'yellow';
    return 'red';
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <VStack spacing={6} align="stretch">
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton height="80px" />
            </CardBody>
          </Card>
        ))}
      </Grid>
      <Skeleton height="300px" />
    </VStack>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <Box textAlign="center" py={10}>
      <Text fontSize="lg" color="gray.500" mb={2}>
        No audience data available
      </Text>
      <Text fontSize="sm" color="gray.400">
        Publish content to start building your audience
      </Text>
    </Box>
  );

  /**
   * Render demographic breakdown bar
   */
  const renderDemographicBar = (label: string, value: number, color: string) => (
    <Box key={label}>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="sm" fontWeight="medium">
          {value.toFixed(1)}%
        </Text>
      </HStack>
      <Progress value={value} colorScheme={color} size="sm" borderRadius="md" />
    </Box>
  );

  if (loading) {
    return renderSkeletons();
  }

  if (!audience) {
    return renderEmptyState();
  }

  return (
    <Box>
      {/* Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Followers</StatLabel>
              <StatNumber>{audience.totalFollowers.toLocaleString()}</StatNumber>
              <StatHelpText>
                {audience.activeFollowers.toLocaleString()} active
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Growth Rate</StatLabel>
              <StatNumber>
                <StatArrow type={audience.growthRate >= 0 ? 'increase' : 'decrease'} />
                {audience.growthRate.toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                +{audience.monthlyGrowth.toLocaleString()} this month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Churn Rate</StatLabel>
              <StatNumber>
                <Badge colorScheme={getChurnBadgeColor(audience.churnRate)}>
                  {audience.churnRate.toFixed(1)}%
                </Badge>
              </StatNumber>
              <StatHelpText>
                {audience.monthlyChurn.toLocaleString()} lost
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Health Score</StatLabel>
              <StatNumber>
                <Badge colorScheme={getHealthBadgeColor(audience.healthScore)} fontSize="xl">
                  {audience.healthScore}/100
                </Badge>
              </StatNumber>
              <StatHelpText>Overall audience quality</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Tabs: Demographics, Growth, Engagement */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Demographics</Tab>
          <Tab>Growth & Retention</Tab>
          <Tab>Engagement</Tab>
        </TabList>

        <TabPanels>
          {/* Demographics Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              {/* Age Groups */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Age Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {renderDemographicBar('13-17', audience.ageGroups['13-17'], 'purple')}
                    {renderDemographicBar('18-24', audience.ageGroups['18-24'], 'blue')}
                    {renderDemographicBar('25-34', audience.ageGroups['25-34'], 'green')}
                    {renderDemographicBar('35-44', audience.ageGroups['35-44'], 'green')}
                    {renderDemographicBar('45-54', audience.ageGroups['45-54'], 'green')}
                    {renderDemographicBar('55-64', audience.ageGroups['55-64'], 'orange')}
                    {renderDemographicBar('65+', audience.ageGroups['65+'], 'orange')}
                  </VStack>
                  <Divider my={3} />
                  <Text fontSize="xs" color="gray.500">
                    High-value demographics: 25-54 (higher CPM rates)
                  </Text>
                </CardBody>
              </Card>

              {/* Income Groups */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Income Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {renderDemographicBar('<$25k', audience.incomeGroups['<25k'], 'red')}
                    {renderDemographicBar('$25-50k', audience.incomeGroups['25-50k'], 'orange')}
                    {renderDemographicBar('$50-75k', audience.incomeGroups['50-75k'], 'green')}
                    {renderDemographicBar('$75-100k', audience.incomeGroups['75-100k'], 'green')}
                    {renderDemographicBar('$100-150k', audience.incomeGroups['100-150k'], 'green')}
                    {renderDemographicBar('>$150k', audience.incomeGroups['>150k'], 'purple')}
                  </VStack>
                  <Divider my={3} />
                  <Text fontSize="xs" color="gray.500">
                    Premium demographics: $50k+ (2-3x higher CPM)
                  </Text>
                </CardBody>
              </Card>

              {/* Geographic Breakdown */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Geographic Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {renderDemographicBar('Local', audience.geographicBreakdown.Local, 'blue')}
                    {renderDemographicBar('Regional', audience.geographicBreakdown.Regional, 'cyan')}
                    {renderDemographicBar('National', audience.geographicBreakdown.National, 'green')}
                    {renderDemographicBar('International', audience.geographicBreakdown.International, 'purple')}
                  </VStack>
                </CardBody>
              </Card>

              {/* Political Alignment */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Political Alignment</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {renderDemographicBar('Left', audience.politicalAlignment.Left, 'blue')}
                    {renderDemographicBar('Center', audience.politicalAlignment.Center, 'gray')}
                    {renderDemographicBar('Right', audience.politicalAlignment.Right, 'red')}
                    {renderDemographicBar('Nonpartisan', audience.politicalAlignment.Nonpartisan, 'green')}
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          {/* Growth & Retention Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <Card>
                <CardHeader>
                  <Heading size="sm">Growth Metrics</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Stat>
                      <StatLabel>Monthly Growth</StatLabel>
                      <StatNumber>{audience.monthlyGrowth.toLocaleString()}</StatNumber>
                      <StatHelpText>New followers this month</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Monthly Churn</StatLabel>
                      <StatNumber color="red.500">
                        {audience.monthlyChurn.toLocaleString()}
                      </StatNumber>
                      <StatHelpText>Lost followers this month</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Net Growth</StatLabel>
                      <StatNumber color={audience.netGrowth >= 0 ? 'green.500' : 'red.500'}>
                        {audience.netGrowth >= 0 ? '+' : ''}
                        {audience.netGrowth.toLocaleString()}
                      </StatNumber>
                      <StatHelpText>Growth - Churn</StatHelpText>
                    </Stat>

                    <Divider />

                    <Box>
                      <Text fontSize="sm" mb={2}>
                        Growth Health: {audience.growthHealth}/100
                      </Text>
                      <Progress
                        value={audience.growthHealth}
                        colorScheme={getHealthBadgeColor(audience.growthHealth)}
                        size="lg"
                        borderRadius="md"
                      />
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Retention Metrics</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Stat>
                      <StatLabel>Retention Rate</StatLabel>
                      <StatNumber>{audience.retentionRate.toFixed(1)}%</StatNumber>
                      <StatHelpText>Followers staying 30+ days</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Avg Follower Lifetime</StatLabel>
                      <StatNumber>{audience.avgFollowerLifetime} months</StatNumber>
                      <StatHelpText>Before churning</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Lifetime Value</StatLabel>
                      <StatNumber color="green.500">
                        ${audience.lifetimeValuePerFollower.toFixed(2)}
                      </StatNumber>
                      <StatHelpText>Per follower</StatHelpText>
                    </Stat>

                    <Divider />

                    <Box>
                      <Text fontSize="sm" mb={2}>
                        Churn Rate: {audience.churnRate.toFixed(1)}%
                      </Text>
                      <Progress
                        value={audience.churnRate}
                        colorScheme={getChurnBadgeColor(audience.churnRate)}
                        size="lg"
                        borderRadius="md"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Healthy: &lt;5%, Critical: &gt;15%
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          {/* Engagement Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <Card>
                <CardHeader>
                  <Heading size="sm">Engagement Metrics</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Stat>
                      <StatLabel>Avg Views Per Follower</StatLabel>
                      <StatNumber>
                        {audience.avgViewsPerFollower.toFixed(1)}
                      </StatNumber>
                      <StatHelpText>Monthly average</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Avg Interaction Rate</StatLabel>
                      <StatNumber>{audience.avgInteractionRate.toFixed(1)}%</StatNumber>
                      <StatHelpText>Likes/shares/comments</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Repeat Visitor Rate</StatLabel>
                      <StatNumber>{audience.repeatVisitorRate.toFixed(1)}%</StatNumber>
                      <StatHelpText>Returning viewers</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Loyal Followers</StatLabel>
                      <StatNumber color="purple.500">
                        {audience.loyalFollowerPercent.toFixed(1)}%
                      </StatNumber>
                      <StatHelpText>10+ interactions/month (5x CPM)</StatHelpText>
                    </Stat>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Audience Quality</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" mb={2}>
                        Engagement Health: {audience.engagementHealth}/100
                      </Text>
                      <Progress
                        value={audience.engagementHealth}
                        colorScheme={getHealthBadgeColor(audience.engagementHealth)}
                        size="lg"
                        borderRadius="md"
                      />
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={2}>
                        Demographic Health: {audience.demographicHealth}/100
                      </Text>
                      <Progress
                        value={audience.demographicHealth}
                        colorScheme={getHealthBadgeColor(audience.demographicHealth)}
                        size="lg"
                        borderRadius="md"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        High-value demographics (25-54, $50k+)
                      </Text>
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={2}>
                        Brand Safety: {audience.brandSafetyScore}/100
                      </Text>
                      <Progress
                        value={audience.brandSafetyScore}
                        colorScheme={getHealthBadgeColor(audience.brandSafetyScore)}
                        size="lg"
                        borderRadius="md"
                      />
                    </Box>

                    <Divider />

                    <Box bg="green.50" p={4} borderRadius="md">
                      <Text fontWeight="bold" mb={2}>
                        Advertiser Appeal Score
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {audience.advertiserAppealScore}/100
                        </Text>
                        <Badge colorScheme={getHealthBadgeColor(audience.advertiserAppealScore)} fontSize="md">
                          {audience.advertiserAppealScore >= 75 ? 'Premium' : audience.advertiserAppealScore >= 50 ? 'Standard' : 'Basic'}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.600" mt={2}>
                        Demographics (40%) + Safety (30%) + Engagement (30%)
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

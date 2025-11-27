/**
 * @file src/components/media/SponsorshipDashboard.tsx
 * @description Sponsorship deal tracking dashboard for Media companies
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Sponsorship dashboard component displaying active brand partnership deals with comprehensive
 * tracking of deliverables, performance metrics, exclusivity terms, payment milestones, and
 * fulfillment progress. Provides tabbed navigation between Active/Completed deals, detailed
 * deal cards with progress tracking, overdue deliverable warnings, exclusivity clause alerts,
 * performance metrics visualization, and fulfillment timeline displays.
 * 
 * COMPONENT ARCHITECTURE:
 * - Tabs navigation: Active Deals / Completed Deals / All Deals
 * - Deal list table: Sponsor/Recipient, Deal Value, Structure, Status, Progress
 * - Deliverable tracking: Progress bars for content requirements with deadline alerts
 * - Performance metrics: Impressions, engagement, brand mentions, sentiment, brand lift
 * - Exclusivity warnings: Alert badges if exclusivity clause active, competitor categories
 * - Fulfillment timeline: Milestone deadlines with completion status indicators
 * - Payment tracking: Total paid, remaining payments, upfront/monthly breakdown
 * - Bonus achievement: Performance bonus progress and achieved bonuses display
 * 
 * STATE MANAGEMENT:
 * - deals: Sponsorship deals array from API
 * - loading: Loading state during fetch
 * - selectedTab: Current tab (Active/Completed/All)
 * - filters: Deal structure, role (sponsor/recipient), status filters
 * - expandedDeal: Currently expanded deal for detailed view
 * 
 * API INTEGRATION:
 * - GET /api/media/sponsorships - Fetch sponsorship deals
 *   Query: role?, status?, dealStructure?, sortBy?, order?
 *   Response: { deals[], meta: { total, active, totalValue, totalBonuses } }
 * 
 * PROPS:
 * - companyId: Company ID for filtering deals (sponsor or recipient)
 * 
 * USAGE:
 * ```tsx
 * <SponsorshipDashboard companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Fulfillment progress: (milestonesAchieved / totalMilestones) × 100
 * - Overdue logic: nextDeadline < Date.now() → show red warning
 * - Bonus achievement: performanceBonuses.filter(b => b.achieved).length / total
 * - Exclusivity alert: Show if exclusivityClause true and current date within exclusivityDuration
 * - Status badges:
 *   - Pending: gray
 *   - Active: green
 *   - Completed: blue
 *   - Cancelled: red
 *   - Disputed: orange
 * - Deal structure types:
 *   - FlatFee: Single upfront payment
 *   - RevenueShare: % of content revenue shared
 *   - PerformanceBased: Payment based on metrics (impressions, brand lift, conversions)
 *   - Hybrid: Combination of upfront + monthly + performance bonuses
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  Badge,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Skeleton,
  Divider,
  Grid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

/**
 * Deal structure enum
 */
type DealStructure = 'FlatFee' | 'RevenueShare' | 'PerformanceBased' | 'Hybrid';

/**
 * Deal status enum
 */
type DealStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled' | 'Disputed';

/**
 * Performance bonus interface
 */
interface PerformanceBonus {
  metric: 'impressions' | 'engagement' | 'brandLift' | 'conversions';
  threshold: number;
  bonus: number;
  achieved: boolean;
}

/**
 * Content requirement interface
 */
interface ContentRequirement {
  type: 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost';
  quantity: number;
  deadline: Date;
  specifications: string;
}

/**
 * Sponsorship deal interface
 */
interface SponsorshipDeal {
  _id: string;
  sponsor: { _id: string; name: string };
  recipient: { _id: string; name: string };
  dealValue: number;
  dealStructure: DealStructure;
  status: DealStatus;
  startDate: Date;
  endDate: Date;
  upfrontPayment: number;
  monthlyPayment: number;
  revenueSharePercent: number;
  totalPaid: number;
  remainingPayments: number;
  requiredMentions: number;
  brandMentions: number;
  contentRequirements: ContentRequirement[];
  performanceBonuses: PerformanceBonus[];
  exclusivityClause: boolean;
  competitorCategories: string[];
  exclusivityDuration: number;
  totalImpressions: number;
  totalEngagement: number;
  brandSentiment: number;
  brandLift: number;
  milestonesAchieved: number;
  totalMilestones: number;
  nextDeadline?: Date;
  overdueDeliverables: number;
  completionRate: number;
  fulfillmentProgress: number;
  averageBonusAchieved: number;
  totalEarnedBonuses: number;
}

/**
 * SponsorshipDashboard component props
 */
interface SponsorshipDashboardProps {
  companyId: string;
}

/**
 * SponsorshipDashboard component
 * 
 * @description
 * Sponsorship deal tracking dashboard for Media companies with deliverable
 * tracking, performance metrics, and fulfillment monitoring
 * 
 * @param {SponsorshipDashboardProps} props - Component props
 * @returns {JSX.Element} SponsorshipDashboard component
 */
export default function SponsorshipDashboard({
  companyId,
}: SponsorshipDashboardProps): JSX.Element {
  const toast = useToast();

  // Deals state
  const [deals, setDeals] = useState<SponsorshipDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<number>(0); // 0 = Active, 1 = Completed, 2 = All

  /**
   * Fetch sponsorship deals from API
   */
  const fetchDeals = async () => {
    setLoading(true);
    try {
      const statusFilter = selectedTab === 0 ? 'Active' : selectedTab === 1 ? 'Completed' : undefined;
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      queryParams.append('sortBy', 'startDate');
      queryParams.append('order', 'desc');

      const response = await fetch(`/api/media/sponsorships?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDeals(data.deals || []);
      } else {
        toast({
          title: 'Failed to load deals',
          description: data.error || 'Could not fetch sponsorship deals',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading deals',
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
   * Fetch deals on mount and tab change
   */
  useEffect(() => {
    fetchDeals();
  }, [companyId, selectedTab]);

  /**
   * Get status badge color
   */
  const getStatusBadgeColor = (status: DealStatus): string => {
    switch (status) {
      case 'Pending':
        return 'gray';
      case 'Active':
        return 'green';
      case 'Completed':
        return 'blue';
      case 'Cancelled':
        return 'red';
      case 'Disputed':
        return 'orange';
      default:
        return 'gray';
    }
  };

  /**
   * Get fulfillment badge color
   */
  const getFulfillmentBadgeColor = (progress: number): string => {
    if (progress >= 80) return 'green';
    if (progress >= 50) return 'yellow';
    return 'red';
  };

  /**
   * Check if deal has overdue deliverables
   */
  const hasOverdueDeliverables = (deal: SponsorshipDeal): boolean => {
    return deal.overdueDeliverables > 0 || !!(deal.nextDeadline && new Date(deal.nextDeadline) < new Date());
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <VStack spacing={4} align="stretch">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height="150px" />
      ))}
    </VStack>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <Box textAlign="center" py={10}>
      <Text fontSize="lg" color="gray.500" mb={2}>
        No sponsorship deals found
      </Text>
      <Text fontSize="sm" color="gray.400">
        {selectedTab === 0 ? 'No active deals at the moment' : selectedTab === 1 ? 'No completed deals yet' : 'No deals available'}
      </Text>
    </Box>
  );

  /**
   * Render deal card
   */
  const renderDealCard = (deal: SponsorshipDeal) => (
    <Card key={deal._id}>
      <CardBody>
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton px={0}>
              <Box flex="1">
                <Grid templateColumns="repeat(5, 1fr)" gap={4}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.500">Sponsor</Text>
                    <Text fontWeight="medium">{deal.sponsor.name}</Text>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.500">Deal Value</Text>
                    <Text fontWeight="bold" color="green.500">
                      ${deal.dealValue.toLocaleString()}
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.500">Structure</Text>
                    <Badge>{deal.dealStructure}</Badge>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.500">Status</Text>
                    <Badge colorScheme={getStatusBadgeColor(deal.status)}>{deal.status}</Badge>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.500">Fulfillment</Text>
                    <HStack>
                      <Badge colorScheme={getFulfillmentBadgeColor(deal.fulfillmentProgress)}>
                        {deal.fulfillmentProgress.toFixed(0)}%
                      </Badge>
                      {hasOverdueDeliverables(deal) && (
                        <WarningIcon color="red.500" boxSize={4} />
                      )}
                    </HStack>
                  </VStack>
                </Grid>
              </Box>
              <AccordionIcon />
            </AccordionButton>

            <AccordionPanel pb={4} px={0}>
              <VStack align="stretch" spacing={4} mt={4}>
                {/* Exclusivity Warning */}
                {deal.exclusivityClause && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Exclusivity Active</AlertTitle>
                      <AlertDescription>
                        Cannot partner with: {deal.competitorCategories.join(', ')} ({deal.exclusivityDuration} months)
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Overdue Warning */}
                {hasOverdueDeliverables(deal) && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Overdue Deliverables</AlertTitle>
                      <AlertDescription>
                        {deal.overdueDeliverables} deliverable(s) past deadline. Next due: {deal.nextDeadline ? new Date(deal.nextDeadline).toLocaleDateString() : 'N/A'}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                <Divider />

                {/* Deliverable Progress */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Deliverable Progress</Text>
                  <Progress
                    value={deal.fulfillmentProgress}
                    colorScheme={getFulfillmentBadgeColor(deal.fulfillmentProgress)}
                    size="lg"
                    borderRadius="md"
                    mb={2}
                  />
                  <HStack justify="space-between" fontSize="sm" color="gray.600">
                    <Text>{deal.milestonesAchieved} / {deal.totalMilestones} milestones completed</Text>
                    <Text>Completion Rate: {deal.completionRate}%</Text>
                  </HStack>
                </Box>

                <Divider />

                {/* Performance Metrics */}
                <Box>
                  <Text fontWeight="bold" mb={3}>Performance Metrics</Text>
                  <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    <Stat>
                      <StatLabel fontSize="xs">Impressions</StatLabel>
                      <StatNumber fontSize="md">{deal.totalImpressions.toLocaleString()}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Engagement</StatLabel>
                      <StatNumber fontSize="md">{deal.totalEngagement.toLocaleString()}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Brand Mentions</StatLabel>
                      <StatNumber fontSize="md">{deal.brandMentions} / {deal.requiredMentions}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Brand Lift</StatLabel>
                      <StatNumber fontSize="md" color="green.500">+{deal.brandLift}%</StatNumber>
                    </Stat>
                  </Grid>
                </Box>

                <Divider />

                {/* Payment Tracking */}
                <Box>
                  <Text fontWeight="bold" mb={3}>Payment Tracking</Text>
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <Stat>
                      <StatLabel fontSize="xs">Total Paid</StatLabel>
                      <StatNumber fontSize="md" color="green.500">
                        ${deal.totalPaid.toLocaleString()}
                      </StatNumber>
                      <StatHelpText fontSize="xs">
                        Upfront: ${deal.upfrontPayment.toLocaleString()}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Remaining</StatLabel>
                      <StatNumber fontSize="md">
                        ${deal.remainingPayments.toLocaleString()}
                      </StatNumber>
                      <StatHelpText fontSize="xs">
                        Monthly: ${deal.monthlyPayment.toLocaleString()}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Bonuses Earned</StatLabel>
                      <StatNumber fontSize="md" color="purple.500">
                        ${deal.totalEarnedBonuses.toLocaleString()}
                      </StatNumber>
                      <StatHelpText fontSize="xs">
                        {deal.averageBonusAchieved}% achieved
                      </StatHelpText>
                    </Stat>
                  </Grid>
                </Box>

                {/* Performance Bonuses */}
                {deal.performanceBonuses.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={2}>Performance Bonuses</Text>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Metric</Th>
                            <Th>Threshold</Th>
                            <Th>Bonus</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {deal.performanceBonuses.map((bonus, index) => (
                            <Tr key={index}>
                              <Td>{bonus.metric}</Td>
                              <Td>{bonus.threshold.toLocaleString()}</Td>
                              <Td>${bonus.bonus.toLocaleString()}</Td>
                              <Td>
                                <Badge colorScheme={bonus.achieved ? 'green' : 'gray'}>
                                  {bonus.achieved ? 'Achieved' : 'Pending'}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </CardBody>
    </Card>
  );

  if (loading) {
    return renderSkeletons();
  }

  return (
    <Box>
      <Tabs index={selectedTab} onChange={setSelectedTab} variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Active Deals</Tab>
          <Tab>Completed Deals</Tab>
          <Tab>All Deals</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {deals.length === 0 ? renderEmptyState() : (
              <VStack spacing={4} align="stretch">
                {deals.map(renderDealCard)}
              </VStack>
            )}
          </TabPanel>

          <TabPanel>
            {deals.length === 0 ? renderEmptyState() : (
              <VStack spacing={4} align="stretch">
                {deals.map(renderDealCard)}
              </VStack>
            )}
          </TabPanel>

          <TabPanel>
            {deals.length === 0 ? renderEmptyState() : (
              <VStack spacing={4} align="stretch">
                {deals.map(renderDealCard)}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

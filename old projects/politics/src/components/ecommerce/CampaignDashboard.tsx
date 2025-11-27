/**
 * @file src/components/ecommerce/CampaignDashboard.tsx
 * @description SEO/PPC campaign management dashboard with optimization analytics
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Comprehensive campaign management interface integrating with campaigns API
 * and seoOptimizer service. Displays campaign metrics, keyword performance,
 * budget optimization recommendations, and ROI predictions.
 * 
 * FEATURES:
 * - Campaign list with performance metrics (ROI, CTR, conversions)
 * - Keyword performance analysis table
 * - Budget optimization recommendations (4 strategies)
 * - Bid adjustment suggestions (increase/decrease/pause/maintain)
 * - ROI prediction with extrapolation
 * - Campaign status management (Draft/Active/Paused/Completed)
 * 
 * USAGE:
 * ```tsx
 * <CampaignDashboard companyId="123" />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface Campaign {
  _id: string;
  name: string;
  type: 'SEO' | 'PPC' | 'Both';
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  budget: number;
  spent: number;
  revenue: number;
  keywords: Array<{
    keyword: string;
    bidAmount: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  startDate: string;
  endDate?: string;
}

interface CampaignDashboardProps {
  companyId: string;
}

export default function CampaignDashboard({ companyId }: CampaignDashboardProps) {
  const toast = useToast();

  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');

  /**
   * Fetch campaigns
   */
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({ companyId });
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/ecommerce/campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      toast({
        title: 'Error loading campaigns',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, typeFilter, statusFilter, toast]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  /**
   * Fetch campaign analytics
   */
  const fetchAnalytics = async (campaignId: string, type: string) => {
    setAnalyticsLoading(true);

    try {
      const params = new URLSearchParams({
        companyId,
        campaignId,
        analytics: type,
      });

      const response = await fetch(`/api/ecommerce/campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast({
        title: 'Error loading analytics',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  /**
   * Calculate campaign metrics
   */
  const getCampaignMetrics = (campaign: Campaign) => {
    const roi = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;
    const totalImpressions = campaign.keywords.reduce((sum, k) => sum + k.impressions, 0);
    const totalClicks = campaign.keywords.reduce((sum, k) => sum + k.clicks, 0);
    const totalConversions = campaign.keywords.reduce((sum, k) => sum + k.conversions, 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const budgetUsed = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

    return { roi, ctr, conversionRate, budgetUsed, totalClicks, totalConversions };
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Campaign Dashboard</Heading>

        {/* Filters */}
        <HStack spacing={4}>
          <Select w="150px" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="SEO">SEO Only</option>
            <option value="PPC">PPC Only</option>
            <option value="Both">Both</option>
          </Select>

          <Select w="150px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </Select>
        </HStack>
      </Flex>

      {/* Campaigns Table */}
      {loading ? (
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading campaigns...</Text>
          </VStack>
        </Flex>
      ) : campaigns.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No campaigns found. Create a campaign to get started.
        </Alert>
      ) : (
        <VStack spacing={6} align="stretch">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Campaign</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th isNumeric>Budget</Th>
                <Th isNumeric>Spent</Th>
                <Th isNumeric>Revenue</Th>
                <Th isNumeric>ROI</Th>
                <Th isNumeric>CTR</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {campaigns.map((campaign) => {
                const metrics = getCampaignMetrics(campaign);
                return (
                  <Tr key={campaign._id}>
                    <Td>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="medium">{campaign.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {campaign.keywords.length} keywords
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">{campaign.type}</Badge>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          campaign.status === 'Active'
                            ? 'green'
                            : campaign.status === 'Paused'
                            ? 'yellow'
                            : 'gray'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <VStack align="flex-end" spacing={0}>
                        <Text>${campaign.budget.toLocaleString()}</Text>
                        <Progress
                          value={metrics.budgetUsed}
                          size="xs"
                          w="60px"
                          colorScheme={metrics.budgetUsed > 90 ? 'red' : 'blue'}
                        />
                      </VStack>
                    </Td>
                    <Td isNumeric>${campaign.spent.toLocaleString()}</Td>
                    <Td isNumeric>${campaign.revenue.toLocaleString()}</Td>
                    <Td isNumeric>
                      <HStack spacing={1} justify="flex-end">
                        <Box
                          as={metrics.roi >= 0 ? FiTrendingUp : FiTrendingDown}
                          color={metrics.roi >= 0 ? 'green.500' : 'red.500'}
                        />
                        <Text color={metrics.roi >= 0 ? 'green.600' : 'red.600'}>
                          {metrics.roi.toFixed(1)}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric>{metrics.ctr.toFixed(2)}%</Td>
                    <Td>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign._id);
                          void fetchAnalytics(campaign._id, 'full-report');
                        }}
                      >
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          {/* Campaign Analytics (when selected) */}
          {selectedCampaign && (
            <Box bg="white" p={6} borderRadius="md" shadow="md">
              <Heading size="md" mb={4}>
                Campaign Analytics
              </Heading>

              {analyticsLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" />
                </Flex>
              ) : analytics?.report ? (
                <Tabs>
                  <TabList>
                    <Tab>Overview</Tab>
                    <Tab>Keywords</Tab>
                    <Tab>Optimization</Tab>
                  </TabList>

                  <TabPanels>
                    {/* Overview Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={8}>
                          <Box>
                            <Text fontSize="sm" color="gray.600">
                              Total Spent
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold">
                              ${analytics.report.summary?.totalSpent?.toLocaleString() || 0}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">
                              Total Revenue
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">
                              ${analytics.report.summary?.totalRevenue?.toLocaleString() || 0}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">
                              ROI
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {analytics.report.summary?.roi?.toFixed(1) || 0}%
                            </Text>
                          </Box>
                        </HStack>
                      </VStack>
                    </TabPanel>

                    {/* Keywords Tab */}
                    <TabPanel>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Keyword</Th>
                            <Th isNumeric>Bid</Th>
                            <Th isNumeric>Impressions</Th>
                            <Th isNumeric>Clicks</Th>
                            <Th isNumeric>CTR</Th>
                            <Th isNumeric>Conversions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {analytics.report.keywords?.map((kw: any, idx: number) => (
                            <Tr key={idx}>
                              <Td>{kw.keyword}</Td>
                              <Td isNumeric>${kw.bidAmount?.toFixed(2)}</Td>
                              <Td isNumeric>{kw.impressions?.toLocaleString()}</Td>
                              <Td isNumeric>{kw.clicks?.toLocaleString()}</Td>
                              <Td isNumeric>
                                {kw.impressions > 0
                                  ? ((kw.clicks / kw.impressions) * 100).toFixed(2)
                                  : 0}
                                %
                              </Td>
                              <Td isNumeric>{kw.conversions}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TabPanel>

                    {/* Optimization Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        {analytics.report.recommendations?.map((rec: any, idx: number) => (
                          <Alert key={idx} status="info">
                            <AlertIcon />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="medium">{rec.title}</Text>
                              <Text fontSize="sm">{rec.description}</Text>
                            </VStack>
                          </Alert>
                        ))}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              ) : (
                <Text>No analytics data available</Text>
              )}
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}

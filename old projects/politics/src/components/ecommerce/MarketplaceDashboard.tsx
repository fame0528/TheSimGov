/**
 * @file src/components/ecommerce/MarketplaceDashboard.tsx
 * @description Platform-level metrics dashboard for marketplace owners
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Comprehensive analytics dashboard for marketplace administrators to monitor
 * platform health, track GMV trends, analyze seller performance, and oversee
 * commission revenue. Provides multi-dimensional insights into marketplace operations.
 * 
 * FEATURES:
 * - GMV (Gross Merchandise Value) trend visualization with time period filtering
 * - Active sellers and product catalog monitoring
 * - Total orders processed and revenue breakdown
 * - Commission revenue tracking by category
 * - Category performance analysis with bar charts
 * - Top sellers ranking table with performance metrics
 * - Data export functionality for reporting
 * - Real-time marketplace health indicators
 * 
 * BUSINESS LOGIC:
 * - GMV calculation: Sum of all successful order totals in period
 * - Commission revenue: (Order total × commission rate) aggregated
 * - Category performance: Revenue grouped by product categories
 * - Seller rankings: Sorted by total GMV contribution
 * - Health indicators: Active sellers/products ratio, order velocity
 * 
 * USAGE:
 * ```tsx
 * import MarketplaceDashboard from '@/components/ecommerce/MarketplaceDashboard';
 * 
 * <MarketplaceDashboard marketplaceId={marketplaceId} />
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
  Grid,
  Select,
  useToast,
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
  Badge,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiDownload } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface MarketplaceDashboardProps {
  marketplaceId: string;
}

interface MarketplaceDetails {
  _id: string;
  name: string;
  companyId: string;
  commissionRate: number;
  activeSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalGMV: number;
  totalCommissionRevenue: number;
  createdAt: string;
}

interface GMVDataPoint {
  date: string;
  gmv: number;
  orders: number;
}

interface CategoryPerformance {
  category: string;
  revenue: number;
  orders: number;
  products: number;
}

interface TopSeller {
  sellerId: string;
  sellerName: string;
  companyName: string;
  totalRevenue: number;
  totalOrders: number;
  performanceRating: number;
  healthScore: number;
}

type TimePeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

// ============================================================================
// Main Component
// ============================================================================

export default function MarketplaceDashboard({ marketplaceId }: MarketplaceDashboardProps) {
  const toast = useToast();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<TimePeriod>('last_30_days');
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceDetails | null>(null);
  const [gmvTrends, setGmvTrends] = useState<GMVDataPoint[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch marketplace analytics data
   * Loads marketplace details and aggregated metrics for the selected time period
   */
  const fetchMarketplaceData = useCallback(async () => {
    if (!marketplaceId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/ecommerce/marketplace/details?marketplaceId=${marketplaceId}&period=${period}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch marketplace data');
      }

      const data = await response.json();

      if (data.success) {
        setMarketplaceData(data.marketplace);
        setGmvTrends(data.analytics?.gmvTrends || []);
        setCategoryPerformance(data.analytics?.categoryPerformance || []);
        setTopSellers(data.analytics?.topSellers || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching marketplace data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load marketplace data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [marketplaceId, period, toast]);

  useEffect(() => {
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  // ============================================================================
  // Export Functionality
  // ============================================================================

  /**
   * Export marketplace analytics to JSON
   */
  const exportData = () => {
    const exportPayload = {
      marketplace: marketplaceData,
      period,
      gmvTrends,
      categoryPerformance,
      topSellers,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketplace-analytics-${period}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: 'Marketplace analytics exported successfully',
      status: 'success',
      duration: 3000,
    });
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color scheme for health score
   */
  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Loading marketplace dashboard...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!marketplaceData) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontWeight="medium">
          Marketplace not found or failed to load data
        </Text>
      </Box>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">
            {marketplaceData.name}
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Marketplace Analytics Dashboard
          </Text>
        </Box>

        <HStack spacing={3}>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as TimePeriod)}
            w="200px"
            bg="white"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="all_time">All Time</option>
          </Select>

          <Button
            leftIcon={<FiDownload />}
            colorScheme="blue"
            variant="outline"
            onClick={exportData}
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Key Metrics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
        <Stat bg="white" p={4} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
          <StatLabel>Total GMV</StatLabel>
          <StatNumber color="blue.600">
            ${marketplaceData.totalGMV.toLocaleString()}
          </StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            Gross Merchandise Value
          </StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
          <StatLabel>Commission Revenue</StatLabel>
          <StatNumber color="green.600">
            ${marketplaceData.totalCommissionRevenue.toLocaleString()}
          </StatNumber>
          <StatHelpText>
            {marketplaceData.commissionRate}% commission rate
          </StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
          <StatLabel>Active Sellers</StatLabel>
          <StatNumber color="purple.600">{marketplaceData.activeSellers}</StatNumber>
          <StatHelpText>
            {marketplaceData.totalProducts} total products
          </StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
          <StatLabel>Total Orders</StatLabel>
          <StatNumber color="orange.600">{marketplaceData.totalOrders}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {period.replace(/_/g, ' ')}
          </StatHelpText>
        </Stat>
      </Grid>

      <Divider />

      {/* Tabs for Analytics Views */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>GMV Trends</Tab>
          <Tab>Category Performance</Tab>
          <Tab>Top Sellers</Tab>
        </TabList>

        <TabPanels>
          {/* GMV Trends Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
              <Heading size="md" mb={4}>
                GMV & Orders Over Time
              </Heading>

              {gmvTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={gmvTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="gmv"
                      stroke="#3182ce"
                      strokeWidth={2}
                      name="GMV ($)"
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#38a169"
                      strokeWidth={2}
                      name="Orders"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  No GMV trend data available for selected period
                </Text>
              )}
            </Box>
          </TabPanel>

          {/* Category Performance Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
              <Heading size="md" mb={4}>
                Performance by Category
              </Heading>

              {categoryPerformance.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={categoryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3182ce" name="Revenue ($)" />
                      <Bar dataKey="orders" fill="#38a169" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table variant="simple" mt={6} size="sm">
                    <Thead>
                      <Tr>
                        <Th>Category</Th>
                        <Th isNumeric>Revenue</Th>
                        <Th isNumeric>Orders</Th>
                        <Th isNumeric>Products</Th>
                        <Th isNumeric>Avg Order Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {categoryPerformance.map((cat, idx) => (
                        <Tr key={idx}>
                          <Td fontWeight="medium">{cat.category}</Td>
                          <Td isNumeric>${cat.revenue.toLocaleString()}</Td>
                          <Td isNumeric>{cat.orders}</Td>
                          <Td isNumeric>{cat.products}</Td>
                          <Td isNumeric>
                            ${cat.orders > 0 ? (cat.revenue / cat.orders).toFixed(2) : '0.00'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </>
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  No category performance data available
                </Text>
              )}
            </Box>
          </TabPanel>

          {/* Top Sellers Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
              <Heading size="md" mb={4}>
                Top Performing Sellers
              </Heading>

              {topSellers.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Rank</Th>
                      <Th>Seller</Th>
                      <Th>Company</Th>
                      <Th isNumeric>Total Revenue</Th>
                      <Th isNumeric>Orders</Th>
                      <Th isNumeric>Performance Rating</Th>
                      <Th>Health Score</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {topSellers.map((seller, idx) => (
                      <Tr key={seller.sellerId}>
                        <Td fontWeight="bold" color={idx < 3 ? 'blue.600' : 'gray.600'}>
                          #{idx + 1}
                        </Td>
                        <Td fontWeight="medium">{seller.sellerName}</Td>
                        <Td fontSize="sm" color="gray.600">
                          {seller.companyName}
                        </Td>
                        <Td isNumeric fontWeight="semibold">
                          ${seller.totalRevenue.toLocaleString()}
                        </Td>
                        <Td isNumeric>{seller.totalOrders}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={seller.performanceRating >= 4.5 ? 'green' : 'yellow'}>
                            {seller.performanceRating.toFixed(1)}⭐
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getHealthScoreColor(seller.healthScore)}>
                            {seller.healthScore}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  No seller performance data available
                </Text>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COMPONENT ARCHITECTURE:
 *    - Client-side rendering with React hooks
 *    - Single API endpoint for all marketplace data (aggregated)
 *    - Time period filtering with Select component
 *    - Tab-based navigation for different analytics views
 * 
 * 2. DATA FLOW:
 *    - useCallback for fetchMarketplaceData (memoized with period dependency)
 *    - useEffect triggers fetch on marketplaceId/period changes
 *    - Single state objects for each data type (marketplace, trends, categories, sellers)
 *    - Error handling with toast notifications
 * 
 * 3. VISUALIZATIONS:
 *    - GMV Trends: Dual-axis LineChart (GMV left, orders right)
 *    - Category Performance: BarChart with revenue + orders bars
 *    - Top Sellers: Table with ranking, badges for ratings/health
 * 
 * 4. USER INTERACTIONS:
 *    - Period selector: Refetches data on change
 *    - Export button: Downloads JSON with all analytics
 *    - Tab switching: No refetch, uses existing state
 * 
 * 5. RESPONSIVE DESIGN:
 *    - Grid layout adapts to screen size (1 col mobile, 4 cols desktop)
 *    - ResponsiveContainer for charts (100% width)
 *    - Table horizontal scroll on mobile
 * 
 * 6. PERFORMANCE:
 *    - useCallback prevents unnecessary refetches
 *    - Conditional rendering for empty states
 *    - Single loading state for all data
 * 
 * 7. ACCESSIBILITY:
 *    - Semantic HTML structure
 *    - ARIA labels inherited from Chakra UI
 *    - Color + text indicators (not color-only)
 */

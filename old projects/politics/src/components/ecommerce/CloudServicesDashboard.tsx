/**
 * @file src/components/ecommerce/CloudServicesDashboard.tsx
 * @description AWS infrastructure cost monitoring and optimization dashboard
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Financial operations dashboard for tracking AWS cloud infrastructure costs,
 * monitoring resource utilization, and identifying optimization opportunities.
 * Provides visibility into service-level spending, budget compliance, and
 * cost trends across EC2, S3, RDS, Lambda, and other AWS services.
 * 
 * FEATURES:
 * - Service cost breakdown with PieChart visualization
 * - Monthly cost trends with AreaChart and forecast
 * - Resource utilization metrics (CPU, memory, storage)
 * - Budget alerts with color-coded severity (warning >80%, critical >95%)
 * - Top 5 cost drivers table with trend indicators
 * - Optimization recommendations (unused resources, right-sizing)
 * - Time period filtering (7d, 30d, 90d, YTD)
 * - Cost export functionality for financial reporting
 * 
 * BUSINESS LOGIC:
 * - Total monthly cost = sum(all service costs in period)
 * - Cost per service = usage × unit price (from AWS billing API)
 * - Budget utilization = (current cost / allocated budget) × 100
 * - Trend calculation = ((current - previous) / previous) × 100
 * - Optimization savings = sum(unused resource costs + right-sizing opportunities)
 * - Alert thresholds: Warning at 80% budget, critical at 95% budget
 * 
 * USAGE:
 * ```tsx
 * import CloudServicesDashboard from '@/components/ecommerce/CloudServicesDashboard';
 * 
 * <CloudServicesDashboard companyId={companyId} budgetLimit={50000} />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Grid,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
} from '@chakra-ui/react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiDownload, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface CloudServicesDashboardProps {
  companyId: string;
  budgetLimit?: number;
}

interface ServiceCost {
  service: string;
  cost: number;
  usage: string;
  trend: number;
}

interface CostTrend {
  date: string;
  cost: number;
  forecast?: number;
}

interface OptimizationRecommendation {
  type: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
}

interface CloudSummary {
  totalMonthlyCost: number;
  budgetRemaining: number;
  topService: string;
  optimizationSavings: number;
}

type TimePeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'ytd';

// Chart colors for services
const CHART_COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20'];

// ============================================================================
// Main Component
// ============================================================================

export default function CloudServicesDashboard({
  companyId,
  budgetLimit = 50000,
}: CloudServicesDashboardProps) {
  const toast = useToast();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<TimePeriod>('last_30_days');
  const [summary, setSummary] = useState<CloudSummary | null>(null);
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([]);
  const [costTrends, setCostTrends] = useState<CostTrend[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch cloud services cost data
   */
  const fetchCloudData = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/ecommerce/cloud/services/summary?companyId=${companyId}&period=${period}&budget=${budgetLimit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cloud services data');
      }

      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
        setServiceCosts(data.serviceCosts || []);
        setCostTrends(data.costTrends || []);
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching cloud data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load cloud services data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, period, budgetLimit, toast]);

  useEffect(() => {
    fetchCloudData();
  }, [fetchCloudData]);

  // ============================================================================
  // Export Functionality
  // ============================================================================

  /**
   * Export cloud cost data to JSON
   */
  const exportData = () => {
    const exportPayload = {
      summary,
      period,
      serviceCosts,
      costTrends,
      recommendations,
      budgetLimit,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloud-costs-${period}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: 'Cloud cost data exported successfully',
      status: 'success',
      duration: 3000,
    });
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Calculate budget utilization percentage
   */
  const getBudgetUtilization = (): number => {
    if (!summary || budgetLimit === 0) return 0;
    return Math.round((summary.totalMonthlyCost / budgetLimit) * 100);
  };

  /**
   * Get budget alert severity
   */
  const getBudgetAlertStatus = (): 'success' | 'warning' | 'error' | 'info' => {
    const utilization = getBudgetUtilization();
    if (utilization >= 95) return 'error';
    if (utilization >= 80) return 'warning';
    return 'success';
  };

  /**
   * Get priority badge color
   */
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading cloud services dashboard...
        </Text>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontWeight="medium">
          Failed to load cloud services data
        </Text>
      </Box>
    );
  }

  const budgetUtilization = getBudgetUtilization();
  const alertStatus = getBudgetAlertStatus();

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">
            Cloud Services Dashboard
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            AWS infrastructure cost monitoring
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
            <option value="ytd">Year to Date</option>
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
      </HStack>

      {/* Budget Alert */}
      {budgetUtilization >= 80 && (
        <Alert status={alertStatus} borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>
              {budgetUtilization >= 95 ? 'Critical: Budget Exceeded' : 'Warning: Budget Alert'}
            </AlertTitle>
            <AlertDescription fontSize="sm">
              {budgetUtilization >= 95
                ? `You have exceeded ${budgetUtilization}% of your monthly budget ($${budgetLimit.toLocaleString()})`
                : `You have used ${budgetUtilization}% of your monthly budget ($${budgetLimit.toLocaleString()})`}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Monthly Cost</StatLabel>
          <StatNumber color="blue.600">${summary.totalMonthlyCost.toLocaleString()}</StatNumber>
          <StatHelpText>
            {budgetUtilization >= 100 ? (
              <StatArrow type="increase" />
            ) : (
              <StatArrow type="decrease" />
            )}
            {budgetUtilization}% of budget
          </StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Budget Remaining</StatLabel>
          <StatNumber
            color={summary.budgetRemaining < 0 ? 'red.600' : 'green.600'}
          >
            ${Math.abs(summary.budgetRemaining).toLocaleString()}
          </StatNumber>
          <StatHelpText>
            {summary.budgetRemaining < 0 ? 'Over budget' : 'Available'}
          </StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Top Service</StatLabel>
          <StatNumber color="purple.600">{summary.topService}</StatNumber>
          <StatHelpText>Highest spend</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Optimization Savings</StatLabel>
          <StatNumber color="orange.600">
            ${summary.optimizationSavings.toLocaleString()}
          </StatNumber>
          <StatHelpText>Potential monthly savings</StatHelpText>
        </Stat>
      </Grid>

      <Divider />

      {/* Tabs for Different Views */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Services</Tab>
          <Tab>Optimization</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
              {/* Service Cost Breakdown Pie Chart */}
              <Box
                bg="white"
                p={6}
                borderRadius="lg"
                shadow="sm"
                border="1px solid"
                borderColor="gray.200"
              >
                <Heading size="md" mb={4}>
                  Service Cost Breakdown
                </Heading>

                {serviceCosts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={serviceCosts as any}
                        dataKey="cost"
                        nameKey="service"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: any) => `${entry.service}: $${entry.cost.toLocaleString()}`}
                      >
                        {serviceCosts.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No service cost data available
                  </Text>
                )}
              </Box>

              {/* Cost Trends Area Chart */}
              <Box
                bg="white"
                p={6}
                borderRadius="lg"
                shadow="sm"
                border="1px solid"
                borderColor="gray.200"
              >
                <Heading size="md" mb={4}>
                  Cost Trends
                </Heading>

                {costTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={costTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#3182ce"
                        fill="#3182ce"
                        fillOpacity={0.3}
                        name="Actual Cost ($)"
                      />
                      {costTrends.some((t) => t.forecast) && (
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          stroke="#d69e2e"
                          fill="#d69e2e"
                          fillOpacity={0.2}
                          strokeDasharray="5 5"
                          name="Forecast ($)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No cost trend data available
                  </Text>
                )}
              </Box>
            </Grid>
          </TabPanel>

          {/* Services Tab */}
          <TabPanel>
            <Box
              bg="white"
              p={6}
              borderRadius="lg"
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
            >
              <Heading size="md" mb={4}>
                Top Cost Drivers
              </Heading>

              {serviceCosts.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Service</Th>
                      <Th isNumeric>Cost</Th>
                      <Th>Usage</Th>
                      <Th>Trend</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serviceCosts.slice(0, 5).map((service, idx) => (
                      <Tr key={idx}>
                        <Td fontWeight="medium">{service.service}</Td>
                        <Td isNumeric fontWeight="semibold">
                          ${service.cost.toLocaleString()}
                        </Td>
                        <Td fontSize="sm" color="gray.600">
                          {service.usage}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {service.trend > 0 ? (
                              <>
                                <FiTrendingUp color="red" />
                                <Badge colorScheme="red">+{service.trend}%</Badge>
                              </>
                            ) : (
                              <>
                                <FiTrendingDown color="green" />
                                <Badge colorScheme="green">{service.trend}%</Badge>
                              </>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  No service cost data available
                </Text>
              )}
            </Box>
          </TabPanel>

          {/* Optimization Tab */}
          <TabPanel>
            <Box
              bg="white"
              p={6}
              borderRadius="lg"
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
            >
              <Heading size="md" mb={4}>
                Optimization Recommendations
              </Heading>

              {recommendations.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {recommendations.map((rec, idx) => (
                    <Box
                      key={idx}
                      p={4}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="gray.50"
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <Badge colorScheme={getPriorityColor(rec.priority)} fontSize="sm">
                            {rec.priority.toUpperCase()}
                          </Badge>
                          <Text fontWeight="bold">{rec.type}</Text>
                        </HStack>
                        <Text fontWeight="semibold" color="green.600">
                          Save ${rec.potentialSavings.toLocaleString()}/mo
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.700">
                        {rec.description}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  No optimization recommendations available
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
 *    - Tab-based navigation (Overview, Services, Optimization)
 *    - Budget alert system with color-coded severity
 *    - Time period filtering with Select dropdown
 *    - Export functionality for financial reporting
 * 
 * 2. DATA FLOW:
 *    - useCallback for fetchCloudData (memoized with period/budget dependencies)
 *    - useEffect triggers fetch on period changes
 *    - Single state objects for summary, costs, trends, recommendations
 *    - Toast notifications for errors and exports
 * 
 * 3. BUDGET ALERTS:
 *    - Warning Alert at 80% utilization (yellow)
 *    - Critical Alert at 95% utilization (red)
 *    - Budget remaining calculation (positive or negative)
 * 
 * 4. VISUALIZATIONS:
 *    - Service breakdown: PieChart with custom labels and colors
 *    - Cost trends: AreaChart with actual + forecast lines
 *    - Top services: Table with trend indicators (up/down arrows)
 * 
 * 5. OPTIMIZATION:
 *    - Priority-based recommendations (high/medium/low)
 *    - Potential savings displayed per recommendation
 *    - Actionable descriptions for each optimization
 * 
 * 6. RESPONSIVE DESIGN:
 *    - Grid layout adapts to screen size (1 col mobile, 2 cols desktop)
 *    - ResponsiveContainer for charts (100% width)
 *    - Horizontal scroll for tables on mobile
 */

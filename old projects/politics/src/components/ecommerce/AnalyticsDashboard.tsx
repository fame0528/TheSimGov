/**
 * @file src/components/ecommerce/AnalyticsDashboard.tsx
 * @description Comprehensive business analytics dashboard with visualizations
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Complete analytics dashboard integrating with analytics API endpoint.
 * Displays customer LTV analysis with RFM segmentation, product performance
 * metrics, revenue forecasting with exponential smoothing, and comprehensive
 * sales reports. Uses recharts for data visualization.
 * 
 * FEATURES:
 * - Customer Lifetime Value (LTV) with RFM segmentation chart
 * - Product performance table with category breakdown
 * - Revenue forecasting with 30/60/90 day predictions
 * - Sales report with comprehensive metrics
 * - Time period filtering (7/30/90 days, all time)
 * - Interactive charts with tooltips
 * - Export functionality for reports
 * 
 * USAGE:
 * ```tsx
 * <AnalyticsDashboard companyId="123" />
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
  Grid,
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiDownload, FiTrendingUp } from 'react-icons/fi';
import type {
  LTVAnalytics,
  ProductAnalytics,
  ForecastAnalytics,
  SalesReport,
  LTVCustomer,
  ProductPerformance,
} from '@/types/api';

interface AnalyticsDashboardProps {
  companyId: string;
}

export default function AnalyticsDashboard({ companyId }: AnalyticsDashboardProps) {
  const toast = useToast();

  // State
  const [period, setPeriod] = useState<'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time'>(
    'last_30_days'
  );
  const [ltvData, setLtvData] = useState<LTVAnalytics | null>(null);
  const [productData, setProductData] = useState<ProductAnalytics | null>(null);
  const [forecastData, setForecastData] = useState<ForecastAnalytics | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch all analytics types in parallel
      const [ltvRes, productRes, forecastRes, salesRes] = await Promise.all([
        fetch(`/api/ecommerce/analytics?companyId=${companyId}&type=customer-ltv&period=${period}`),
        fetch(
          `/api/ecommerce/analytics?companyId=${companyId}&type=product-performance&period=${period}`
        ),
        fetch(
          `/api/ecommerce/analytics?companyId=${companyId}&type=revenue-forecast&forecastDays=30`
        ),
        fetch(`/api/ecommerce/analytics?companyId=${companyId}&type=sales-report&period=${period}`),
      ]);

      const [ltv, product, forecast, sales] = await Promise.all([
        ltvRes.json(),
        productRes.json(),
        forecastRes.json(),
        salesRes.json(),
      ]);

      setLtvData(ltv.data);
      setProductData(product.data);
      setForecastData(forecast.data);
      setSalesReport(sales.data);
    } catch (error) {
      toast({
        title: 'Error loading analytics',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, period, toast]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  /**
   * Export report as JSON
   */
  const exportReport = () => {
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      customerLTV: ltvData,
      productPerformance: productData,
      revenueForecast: forecastData,
      salesReport,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${period}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Report exported',
      status: 'success',
      duration: 3000,
    });
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="600px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading analytics...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Analytics Dashboard</Heading>

        <HStack spacing={4}>
          <Select
            w="200px"
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
          >            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="all_time">All Time</option>
          </Select>

          <Button leftIcon={<FiDownload />} onClick={exportReport}>
            Export Report
          </Button>
        </HStack>
      </Flex>

      {/* Key Metrics Summary */}
      {salesReport && (
        <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={6}>
          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Total Revenue</StatLabel>
            <StatNumber>${salesReport.totalRevenue?.toLocaleString() || 0}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {period}
            </StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Total Orders</StatLabel>
            <StatNumber>{salesReport.totalOrders?.toLocaleString() || 0}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {period}
            </StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Avg Order Value</StatLabel>
            <StatNumber>
              ${salesReport.averageOrderValue?.toFixed(2) || 0}
            </StatNumber>
            <StatHelpText>{period}</StatHelpText>
          </Stat>

          <Stat bg="white" p={4} borderRadius="md" shadow="sm">
            <StatLabel>Active Customers</StatLabel>
            <StatNumber>{salesReport.uniqueCustomers?.toLocaleString() || 0}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {period}
            </StatHelpText>
          </Stat>
        </Grid>
      )}

      {/* Analytics Tabs */}
      <Tabs>
        <TabList>
          <Tab>Customer LTV</Tab>
          <Tab>Product Performance</Tab>
          <Tab>Revenue Forecast</Tab>
          <Tab>Sales Report</Tab>
        </TabList>

        <TabPanels>
          {/* Customer LTV Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box bg="white" p={6} borderRadius="md" shadow="sm">
                <Heading size="md" mb={4}>
                  Customer Segmentation (RFM Analysis)
                </Heading>
                {ltvData?.segments && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(ltvData.segments).map(([segment, count]) => ({
                          name: segment,
                          value: count,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(ltvData.segments).map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>

              <Box bg="white" p={6} borderRadius="md" shadow="sm">
                <Heading size="md" mb={4}>
                  Top Customers by Lifetime Value
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Customer</Th>
                      <Th isNumeric>Total Spent</Th>
                      <Th isNumeric>Orders</Th>
                      <Th>Segment</Th>
                      <Th isNumeric>Predicted LTV</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {ltvData?.topCustomers?.slice(0, 10).map((customer: LTVCustomer, idx: number) => (
                      <Tr key={idx}>
                        <Td>{customer.customerId}</Td>
                        <Td isNumeric>${customer.totalSpent?.toFixed(2)}</Td>
                        <Td isNumeric>{customer.orderCount}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              customer.segment === 'Champion'
                                ? 'purple'
                                : customer.segment === 'Loyal'
                                ? 'green'
                                : 'blue'
                            }
                          >
                            {customer.segment}
                          </Badge>
                        </Td>
                        <Td isNumeric>${customer.predictedLTV?.toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </TabPanel>

          {/* Product Performance Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box bg="white" p={6} borderRadius="md" shadow="sm">
                <Heading size="md" mb={4}>
                  Sales by Category
                </Heading>
                {productData?.categoryBreakdown && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productData.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                      <Bar dataKey="unitsSold" fill="#82ca9d" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>

              <Box bg="white" p={6} borderRadius="md" shadow="sm">
                <Heading size="md" mb={4}>
                  Top Products
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Product</Th>
                      <Th isNumeric>Revenue</Th>
                      <Th isNumeric>Units Sold</Th>
                      <Th isNumeric>Avg Price</Th>
                      <Th isNumeric>Inventory Turnover</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {productData?.topProducts?.slice(0, 10).map((product: ProductPerformance, idx: number) => (
                      <Tr key={idx}>
                        <Td>{product.productName}</Td>
                        <Td isNumeric>${product.revenue?.toLocaleString()}</Td>
                        <Td isNumeric>{product.unitsSold?.toLocaleString()}</Td>
                        <Td isNumeric>${product.averagePrice?.toFixed(2)}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={product.turnoverRate > 5 ? 'green' : 'yellow'}>
                            {product.turnoverRate?.toFixed(1)}x
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </TabPanel>

          {/* Revenue Forecast Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="md" shadow="sm">
              <Heading size="md" mb={4}>
                30-Day Revenue Forecast (Exponential Smoothing)
              </Heading>
              {forecastData?.forecast && (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={forecastData.forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        name="Actual Revenue"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        strokeDasharray="5 5"
                        name="Predicted Revenue"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={6}>
                    <Box p={4} bg="blue.50" borderRadius="md">
                      <Text fontSize="sm" color="gray.600">
                        Total Predicted Revenue
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        ${forecastData.totalPredicted?.toLocaleString()}
                      </Text>
                    </Box>
                    <Box p={4} bg="green.50" borderRadius="md">
                      <Text fontSize="sm" color="gray.600">
                        Growth Rate
                      </Text>
                      <HStack>
                        <FiTrendingUp color="green" />
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {forecastData.growthRate?.toFixed(1)}%
                        </Text>
                      </HStack>
                    </Box>
                    <Box p={4} bg="purple.50" borderRadius="md">
                      <Text fontSize="sm" color="gray.600">
                        Confidence Level
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {forecastData.confidence || 'High'}
                      </Text>
                    </Box>
                  </Grid>
                </>
              )}
            </Box>
          </TabPanel>

          {/* Sales Report Tab */}
          <TabPanel>
            <Box bg="white" p={6} borderRadius="md" shadow="sm">
              <Heading size="md" mb={4}>
                Comprehensive Sales Report
              </Heading>
              {salesReport && (
                <VStack spacing={6} align="stretch">
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Total Revenue
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold">
                        ${salesReport.totalRevenue?.toLocaleString()}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Total Orders
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold">
                        {salesReport.totalOrders?.toLocaleString()}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Average Order Value
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold">
                        ${salesReport.averageOrderValue?.toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Unique Customers
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold">
                        {salesReport.uniqueCustomers?.toLocaleString()}
                      </Text>
                    </Box>
                  </Grid>

                  <Divider />

                  <Box>
                    <Text fontSize="lg" fontWeight="medium" mb={4}>
                      Revenue Breakdown
                    </Text>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        <Tr>
                          <Td>Subtotal</Td>
                          <Td isNumeric>${salesReport.subtotal?.toLocaleString()}</Td>
                        </Tr>
                        <Tr>
                          <Td>Shipping Revenue</Td>
                          <Td isNumeric>${salesReport.shippingRevenue?.toLocaleString()}</Td>
                        </Tr>
                        <Tr>
                          <Td>Tax Collected</Td>
                          <Td isNumeric>${salesReport.taxCollected?.toLocaleString()}</Td>
                        </Tr>
                        <Tr fontWeight="bold">
                          <Td>Total</Td>
                          <Td isNumeric>${salesReport.totalRevenue?.toLocaleString()}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </VStack>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

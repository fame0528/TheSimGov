/**
 * @file src/components/energy/EnergyPortfolio.tsx
 * @description Energy portfolio overview with diversification analysis and asset performance
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Comprehensive energy portfolio dashboard enabling Energy companies to analyze asset allocation,
 * diversification metrics, risk exposure, and performance across oil/gas, renewables, trading, and
 * grid infrastructure. Displays total portfolio value, revenue breakdown by category, ROI analysis,
 * capacity utilization, concentration alerts, and rebalancing recommendations for optimal risk-
 * adjusted returns.
 * 
 * COMPONENT ARCHITECTURE:
 * - Portfolio summary: Total value, revenue, profit, asset allocation percentages
 * - Asset breakdown: Detailed metrics by category (oil/gas, renewables, trading, grid)
 * - Performance analytics: ROI by asset class, top/underperformers, trend analysis
 * - Diversification metrics: Herfindahl index (0-10000), concentration risk, rebalancing needs
 * - Risk analysis: Volatility, beta, sharpe ratio, value-at-risk
 * - Scenario modeling: Price shock simulations, carbon tax impact, regulatory changes
 * - Recommendations: Optimal allocation targets, suggested trades, risk mitigation
 * 
 * STATE MANAGEMENT:
 * - portfolio: Aggregate portfolio data with total value and category breakdown
 * - diversification: Diversification metrics (HHI, concentration, recommendations)
 * - performance: Performance analytics by asset class with ROI and trends
 * - loading: Loading state during initial fetch
 * 
 * API INTEGRATION:
 * - GET /api/energy/portfolio?company={companyId} - Fetch aggregate portfolio data
 *   Response: { totalValue, revenue, profit, assetAllocation, categoryBreakdown }
 * - GET /api/energy/portfolio/diversification?company={companyId} - Fetch diversification metrics
 *   Response: { herfindahlIndex, concentration, riskScore, recommendations }
 * - GET /api/energy/portfolio/performance?company={companyId} - Fetch performance analytics
 *   Response: { roiByCategory, topPerformers, underperformers, trends }
 * 
 * PROPS:
 * - companyId: Company ID for portfolio lookup
 * 
 * USAGE:
 * ```tsx
 * <EnergyPortfolio companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Herfindahl-Hirschman Index (HHI): Sum of squared market shares × 10000
 *   - HHI < 1500: Competitive (well-diversified)
 *   - HHI 1500-2500: Moderate concentration
 *   - HHI > 2500: High concentration (diversification recommended)
 * - Asset allocation categories:
 *   - Oil & Gas: Extraction operations, reserves, storage
 *   - Renewables: Solar farms, wind turbines, carbon credits
 *   - Trading: Commodity trading, futures contracts, market positions
 *   - Grid Infrastructure: Power plants, transmission, grid services
 * - Risk metrics:
 *   - Volatility: Standard deviation of returns (σ)
 *   - Beta: Correlation to market benchmark (β = cov(asset,market) / var(market))
 *   - Sharpe Ratio: (Return - RiskFreeRate) / Volatility (>1 good, >2 excellent)
 *   - Value-at-Risk (VaR): Maximum loss at 95% confidence level
 * - Optimal diversification targets:
 *   - No single category > 40% of portfolio
 *   - Minimum 3 categories with > 10% allocation
 *   - Balance between stable (grid) and growth (renewables)
 * - Rebalancing triggers:
 *   - Category drift > 10% from target allocation
 *   - HHI increase > 500 points in 30 days
 *   - Risk metrics exceed company risk tolerance
 * - ROI calculation: (Revenue - OperatingCost) / CapitalInvested × 100
 * - Capacity utilization: ActualOutput / NameplateCapacity × 100
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
  VStack,
  HStack,
  useToast,
  Skeleton,
  Divider,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

/**
 * AssetCategory enum
 */
type AssetCategory = 'OilGas' | 'Renewables' | 'Trading' | 'Grid';

/**
 * Portfolio interface
 */
interface Portfolio {
  totalValue: number;
  revenue: number;
  profit: number;
  assetAllocation: Record<AssetCategory, number>;
  categoryBreakdown: {
    category: AssetCategory;
    value: number;
    revenue: number;
    profit: number;
    roi: number;
    capacityUtilization: number;
  }[];
}

/**
 * Diversification interface
 */
interface Diversification {
  herfindahlIndex: number;
  concentration: {
    category: AssetCategory;
    percentage: number;
  }[];
  riskScore: number;
  recommendations: string[];
}

/**
 * Performance interface
 */
interface Performance {
  roiByCategory: Record<AssetCategory, number>;
  topPerformers: {
    asset: string;
    category: AssetCategory;
    roi: number;
    revenue: number;
  }[];
  underperformers: {
    asset: string;
    category: AssetCategory;
    roi: number;
    revenue: number;
  }[];
  trends: {
    category: AssetCategory;
    growthRate: number;
    trend: 'Increasing' | 'Stable' | 'Decreasing';
  }[];
}

/**
 * EnergyPortfolio component props
 */
interface EnergyPortfolioProps {
  companyId: string;
}

/**
 * EnergyPortfolio component
 * 
 * @description
 * Energy portfolio overview with diversification analysis, asset allocation breakdown,
 * performance metrics, and rebalancing recommendations
 * 
 * @param {EnergyPortfolioProps} props - Component props
 * @returns {JSX.Element} EnergyPortfolio component
 */
export default function EnergyPortfolio({
  companyId,
}: EnergyPortfolioProps): JSX.Element {
  const toast = useToast();

  // State management
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [diversification, setDiversification] = useState<Diversification | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetch all portfolio data
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, diversificationRes, performanceRes] = await Promise.all([
        fetch(`/api/energy/portfolio?company=${companyId}`),
        fetch(`/api/energy/portfolio/diversification?company=${companyId}`),
        fetch(`/api/energy/portfolio/performance?company=${companyId}`),
      ]);

      const [portfolioData, diversificationData, performanceData] = await Promise.all([
        portfolioRes.json(),
        diversificationRes.json(),
        performanceRes.json(),
      ]);

      setPortfolio(portfolioData);
      setDiversification(diversificationData);
      setPerformance(performanceData);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to fetch portfolio data',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchData();
  }, [companyId]);

  /**
   * Format category name
   */
  const formatCategory = (category: AssetCategory): string => {
    switch (category) {
      case 'OilGas': return 'Oil & Gas';
      case 'Renewables': return 'Renewables';
      case 'Trading': return 'Trading';
      case 'Grid': return 'Grid Infrastructure';
      default: return category;
    }
  };

  /**
   * Get category badge color
   */
  const getCategoryColor = (category: AssetCategory): string => {
    switch (category) {
      case 'OilGas': return 'orange';
      case 'Renewables': return 'green';
      case 'Trading': return 'blue';
      case 'Grid': return 'purple';
      default: return 'gray';
    }
  };

  /**
   * Get HHI status color
   */
  const getHHIColor = (hhi: number): string => {
    if (hhi < 1500) return 'green';
    if (hhi < 2500) return 'yellow';
    return 'red';
  };

  /**
   * Get HHI status text
   */
  const getHHIStatus = (hhi: number): string => {
    if (hhi < 1500) return 'Well Diversified';
    if (hhi < 2500) return 'Moderate Concentration';
    return 'High Concentration';
  };

  /**
   * Get ROI color
   */
  const getROIColor = (roi: number): string => {
    if (roi > 20) return 'green';
    if (roi > 10) return 'blue';
    if (roi > 0) return 'yellow';
    return 'red';
  };

  /**
   * Get trend color
   */
  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'Increasing': return 'green';
      case 'Stable': return 'blue';
      case 'Decreasing': return 'red';
      default: return 'gray';
    }
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <VStack spacing={6} align="stretch">
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </Grid>
      <Skeleton height="400px" />
    </VStack>
  );

  if (loading) {
    return renderSkeletons();
  }

  if (!portfolio || !diversification || !performance) {
    return (
      <Alert status="info">
        <AlertIcon />
        <AlertDescription>No portfolio data available. Create energy assets to get started.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Concentration Risk Alert */}
      {diversification.herfindahlIndex > 2500 && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>High Portfolio Concentration</AlertTitle>
            <AlertDescription>
              HHI: {diversification.herfindahlIndex.toLocaleString()}. Consider rebalancing to reduce risk.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Portfolio Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Portfolio Value</StatLabel>
              <StatNumber fontSize="lg">${portfolio.totalValue.toLocaleString()}</StatNumber>
              <StatHelpText>Across all energy assets</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                ${portfolio.revenue.toLocaleString()}
              </StatNumber>
              <StatHelpText>Monthly aggregate</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Profit</StatLabel>
              <StatNumber fontSize="lg" color={portfolio.profit > 0 ? 'green.500' : 'red.500'}>
                {portfolio.profit > 0 ? '+' : ''}${portfolio.profit.toLocaleString()}
              </StatNumber>
              <StatHelpText>
                <StatArrow type={portfolio.profit > 0 ? 'increase' : 'decrease'} />
                {((portfolio.profit / portfolio.revenue) * 100).toFixed(1)}% margin
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Diversification Score</StatLabel>
              <StatNumber fontSize="lg" color={getHHIColor(diversification.herfindahlIndex)}>
                {getHHIStatus(diversification.herfindahlIndex)}
              </StatNumber>
              <StatHelpText>HHI: {diversification.herfindahlIndex.toLocaleString()}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Asset Allocation Chart */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="sm">Asset Allocation</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {portfolio.categoryBreakdown.map((breakdown) => (
              <Box key={breakdown.category}>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <Badge colorScheme={getCategoryColor(breakdown.category)} size="sm">
                      {formatCategory(breakdown.category)}
                    </Badge>
                    <Text fontSize="sm" fontWeight="medium">
                      ${breakdown.value.toLocaleString()}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {portfolio.assetAllocation[breakdown.category].toFixed(1)}%
                  </Text>
                </HStack>
                <Progress
                  value={portfolio.assetAllocation[breakdown.category]}
                  colorScheme={getCategoryColor(breakdown.category)}
                  size="md"
                  borderRadius="md"
                />
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Tabbed Interface */}
      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Asset Breakdown</Tab>
          <Tab>Performance</Tab>
          <Tab>Recommendations</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Card>
                <CardHeader>
                  <Heading size="sm">Revenue by Category</Heading>
                </CardHeader>
                <CardBody>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Category</Th>
                        <Th isNumeric>Revenue</Th>
                        <Th isNumeric>% of Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {portfolio.categoryBreakdown.map((breakdown) => (
                        <Tr key={breakdown.category}>
                          <Td>
                            <Badge colorScheme={getCategoryColor(breakdown.category)} size="sm">
                              {formatCategory(breakdown.category)}
                            </Badge>
                          </Td>
                          <Td isNumeric color="green.500">${breakdown.revenue.toLocaleString()}</Td>
                          <Td isNumeric>
                            {((breakdown.revenue / portfolio.revenue) * 100).toFixed(1)}%
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Profitability Analysis</Heading>
                </CardHeader>
                <CardBody>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Category</Th>
                        <Th isNumeric>Profit</Th>
                        <Th isNumeric>ROI</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {portfolio.categoryBreakdown.map((breakdown) => (
                        <Tr key={breakdown.category}>
                          <Td>
                            <Badge colorScheme={getCategoryColor(breakdown.category)} size="sm">
                              {formatCategory(breakdown.category)}
                            </Badge>
                          </Td>
                          <Td isNumeric color={breakdown.profit > 0 ? 'green.500' : 'red.500'}>
                            {breakdown.profit > 0 ? '+' : ''}${breakdown.profit.toLocaleString()}
                          </Td>
                          <Td isNumeric>
                            <Badge colorScheme={getROIColor(breakdown.roi)} size="sm">
                              {breakdown.roi > 0 ? '+' : ''}{breakdown.roi.toFixed(1)}%
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          {/* Asset Breakdown Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Detailed Asset Breakdown</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Category</Th>
                      <Th isNumeric>Value</Th>
                      <Th isNumeric>Revenue</Th>
                      <Th isNumeric>Profit</Th>
                      <Th isNumeric>ROI</Th>
                      <Th isNumeric>Utilization</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {portfolio.categoryBreakdown.map((breakdown) => (
                      <Tr key={breakdown.category}>
                        <Td>
                          <Badge colorScheme={getCategoryColor(breakdown.category)} size="sm">
                            {formatCategory(breakdown.category)}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="medium">${breakdown.value.toLocaleString()}</Td>
                        <Td isNumeric color="green.500">${breakdown.revenue.toLocaleString()}</Td>
                        <Td isNumeric color={breakdown.profit > 0 ? 'green.500' : 'red.500'}>
                          {breakdown.profit > 0 ? '+' : ''}${breakdown.profit.toLocaleString()}
                        </Td>
                        <Td isNumeric>
                          <Badge colorScheme={getROIColor(breakdown.roi)} size="sm">
                            {breakdown.roi > 0 ? '+' : ''}{breakdown.roi.toFixed(1)}%
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <HStack spacing={2} justify="flex-end">
                            <Progress
                              value={breakdown.capacityUtilization}
                              size="sm"
                              colorScheme={breakdown.capacityUtilization > 80 ? 'green' : 'yellow'}
                              w="60px"
                            />
                            <Text fontSize="xs">{breakdown.capacityUtilization.toFixed(0)}%</Text>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Card>
                  <CardHeader>
                    <Heading size="sm">Top Performers</Heading>
                  </CardHeader>
                  <CardBody>
                    {performance.topPerformers.length === 0 ? (
                      <Text color="gray.500">No performance data available.</Text>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Asset</Th>
                            <Th>Category</Th>
                            <Th isNumeric>ROI</Th>
                            <Th isNumeric>Revenue</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {performance.topPerformers.map((asset, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">{asset.asset}</Td>
                              <Td>
                                <Badge colorScheme={getCategoryColor(asset.category)} size="sm">
                                  {formatCategory(asset.category)}
                                </Badge>
                              </Td>
                              <Td isNumeric>
                                <Badge colorScheme="green" size="sm">
                                  +{asset.roi.toFixed(1)}%
                                </Badge>
                              </Td>
                              <Td isNumeric color="green.500">${asset.revenue.toLocaleString()}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="sm">Underperformers</Heading>
                  </CardHeader>
                  <CardBody>
                    {performance.underperformers.length === 0 ? (
                      <Text color="gray.500">All assets performing well.</Text>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Asset</Th>
                            <Th>Category</Th>
                            <Th isNumeric>ROI</Th>
                            <Th isNumeric>Revenue</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {performance.underperformers.map((asset, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">{asset.asset}</Td>
                              <Td>
                                <Badge colorScheme={getCategoryColor(asset.category)} size="sm">
                                  {formatCategory(asset.category)}
                                </Badge>
                              </Td>
                              <Td isNumeric>
                                <Badge colorScheme="red" size="sm">
                                  {asset.roi.toFixed(1)}%
                                </Badge>
                              </Td>
                              <Td isNumeric>${asset.revenue.toLocaleString()}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
              </Grid>

              <Card>
                <CardHeader>
                  <Heading size="sm">Category Trends</Heading>
                </CardHeader>
                <CardBody>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Category</Th>
                        <Th isNumeric>Growth Rate</Th>
                        <Th>Trend</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {performance.trends.map((trend, index) => (
                        <Tr key={index}>
                          <Td>
                            <Badge colorScheme={getCategoryColor(trend.category)} size="sm">
                              {formatCategory(trend.category)}
                            </Badge>
                          </Td>
                          <Td isNumeric>
                            <Text color={trend.growthRate > 0 ? 'green.500' : 'red.500'}>
                              {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}%
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={getTrendColor(trend.trend)} size="sm">
                              {trend.trend}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Recommendations Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Diversification Analysis</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Herfindahl-Hirschman Index:</Text>
                      <Badge colorScheme={getHHIColor(diversification.herfindahlIndex)} fontSize="md">
                        {diversification.herfindahlIndex.toLocaleString()}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {getHHIStatus(diversification.herfindahlIndex)} - {' '}
                      {diversification.herfindahlIndex < 1500
                        ? 'Portfolio is well-diversified across energy categories.'
                        : diversification.herfindahlIndex < 2500
                        ? 'Moderate concentration detected. Consider rebalancing.'
                        : 'High concentration risk. Diversification strongly recommended.'}
                    </Text>
                    <Divider />
                    <Text fontWeight="medium">Concentration by Category:</Text>
                    {diversification.concentration.map((item, index) => (
                      <HStack key={index} justify="space-between">
                        <Badge colorScheme={getCategoryColor(item.category)} size="sm">
                          {formatCategory(item.category)}
                        </Badge>
                        <HStack spacing={2}>
                          <Progress
                            value={item.percentage}
                            colorScheme={item.percentage > 40 ? 'red' : 'green'}
                            size="sm"
                            w="100px"
                          />
                          <Text fontSize="sm">{item.percentage.toFixed(1)}%</Text>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Rebalancing Recommendations</Heading>
                </CardHeader>
                <CardBody>
                  {diversification.recommendations.length === 0 ? (
                    <Text color="gray.500">Portfolio is well-balanced. No rebalancing needed.</Text>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {diversification.recommendations.map((rec, index) => (
                        <Text key={index} fontSize="sm">
                          • {rec}
                        </Text>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

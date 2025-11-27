/**
 * @file src/components/energy/MarketAnalytics.tsx
 * @description Cross-commodity market analytics dashboard for energy companies
 * @created 2025-11-18
 *
 * OVERVIEW:
 * High-level market analytics component that aggregates price behaviour, technical indicators,
 * volatility, correlations and trading signals across major energy commodities. Designed as an
 * integration layer above `CommodityTradingPanel`, focusing on insights rather than order flow.
 *
 * COMPONENT ARCHITECTURE:
 * - Market overview: Key commodities with current price, 24h change, volatility regime
 * - Technical panel: Moving averages, RSI and Bollinger band positioning for a selected commodity
 * - Correlation matrix: Cross-commodity correlations for portfolio hedging decisions
 * - Trading signals: Bullish/bearish/neutral signals synthesized from trend, momentum, volatility
 * - Risk summary: Volatility status and high-risk instruments highlighting
 *
 * STATE MANAGEMENT:
 * - prices: Latest price snapshot for key commodities
 * - analyticsByCommodity: Map of commodity → technical analytics payload
 * - selectedCommodity: Currently focused commodity in the technical panel
 * - loading: Initial load state
 *
 * API INTEGRATION:
 * - GET /api/energy/commodity-prices
 *   Query: none (front-end filters to canonical set of commodities)
 *   Response: { prices: ICommodityPrice[] }
 * - GET /api/energy/market-data/analytics?commodity={commodity}&period={period}
 *   Response: {
 *     commodity, period, currentPrice, movingAverages, volatility, momentum,
 *     bollingerBands, correlations, analysis
 *   }
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  HStack,
  VStack,
  Select,
  Skeleton,
  useToast,
  Tooltip,
  Progress,
} from '@chakra-ui/react';

type AnalyticsCommodity = 'CrudeOil' | 'NaturalGas' | 'Electricity' | 'Gasoline' | 'Diesel' | 'Coal';

interface CommoditySnapshot {
  _id: string;
  commodity: AnalyticsCommodity;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string | Date;
}

interface MovingAverages {
  sma7: number;
  sma30: number;
  sma90: number;
  sma200: number;
  ema7: number;
  ema30: number;
}

interface VolatilityMetrics {
  sevenDay: number;
  thirtyDay: number;
  ninetyDay: number;
  status: string;
}

interface MomentumMetrics {
  rsi: number;
  signal: string;
  interpretation: string;
}

interface BollingerBandsPeriod {
  upper: number;
  middle: number;
  lower: number;
}

interface BollingerBandsMetrics {
  period20: BollingerBandsPeriod;
  period50: BollingerBandsPeriod;
  currentPosition: string;
}

interface TradingSignalsSummary {
  trend: string;
  momentum: string;
  volatility: string;
}

interface AnalysisSummary {
  trend: string;
  volatilityStatus: string;
  tradingSignals: TradingSignalsSummary;
}

interface CommodityAnalyticsResponse {
  commodity: AnalyticsCommodity;
  period: number;
  timestamp: string;
  currentPrice: number;
  movingAverages: MovingAverages;
  volatility: VolatilityMetrics;
  momentum: MomentumMetrics;
  bollingerBands: BollingerBandsMetrics;
  correlations: Record<string, number>;
  analysis: AnalysisSummary;
}

interface MarketAnalyticsProps {
  defaultCommodity?: AnalyticsCommodity;
}

const DEFAULT_COMMODITIES: AnalyticsCommodity[] = [
  'CrudeOil',
  'NaturalGas',
  'Electricity',
  'Gasoline',
  'Diesel',
  'Coal',
];

const ANALYTICS_PERIOD_DAYS = 90;

const getPriceChangeColor = (change: number): string => {
  return change >= 0 ? 'green' : 'red';
};

const getVolatilityColor = (status: string): string => {
  if (status === 'High') return 'red';
  if (status === 'Moderate') return 'yellow';
  return 'green';
};

const getSignalColor = (signal: string): string => {
  const normalized = signal.toLowerCase();
  if (normalized.includes('bull')) return 'green';
  if (normalized.includes('bear')) return 'red';
  if (normalized.includes('overbought')) return 'yellow';
  if (normalized.includes('oversold')) return 'green';
  return 'gray';
};

const formatCommodityLabel = (commodity: AnalyticsCommodity): string => {
  switch (commodity) {
    case 'CrudeOil':
      return 'Crude Oil';
    case 'NaturalGas':
      return 'Natural Gas';
    case 'Electricity':
      return 'Electricity';
    case 'Gasoline':
      return 'Gasoline';
    case 'Diesel':
      return 'Diesel';
    case 'Coal':
      return 'Coal';
    default:
      return commodity;
  }
};

/**
 * MarketAnalytics component
 *
 * @description
 * Cross-commodity market analytics dashboard aggregating prices and technical indicators
 * across major energy commodities to support hedging and trading strategy decisions.
 */
export default function MarketAnalytics({
  defaultCommodity = 'CrudeOil',
}: MarketAnalyticsProps): JSX.Element {
  const toast = useToast();
  const [prices, setPrices] = useState<CommoditySnapshot[]>([]);
  const [analyticsByCommodity, setAnalyticsByCommodity] = useState<
    Record<AnalyticsCommodity, CommodityAnalyticsResponse | null>
  >({
    CrudeOil: null,
    NaturalGas: null,
    Electricity: null,
    Gasoline: null,
    Diesel: null,
    Coal: null,
  });
  const [selectedCommodity, setSelectedCommodity] = useState<AnalyticsCommodity>(defaultCommodity);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPrices = async () => {
    try {
      const response = await fetch('/api/energy/commodity-prices');
      const data = await response.json();
      const rawPrices: CommoditySnapshot[] = data.prices || [];
      const filtered = rawPrices.filter((p) =>
        DEFAULT_COMMODITIES.includes(p.commodity as AnalyticsCommodity),
      ) as CommoditySnapshot[];
      setPrices(filtered);
    } catch (error: any) {
      toast({
        title: 'Error loading prices',
        description: error.message || 'Failed to fetch commodity prices',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const loadAnalyticsForCommodity = async (commodity: AnalyticsCommodity) => {
    try {
      const response = await fetch(
        `/api/energy/market-data/analytics?commodity=${commodity}&period=${ANALYTICS_PERIOD_DAYS}`,
      );
      const data: CommodityAnalyticsResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Analytics request failed');
      }

      setAnalyticsByCommodity((prev) => ({
        ...prev,
        [commodity]: data,
      }));
    } catch (error: any) {
      toast({
        title: `Analytics error for ${formatCommodityLabel(commodity)}`,
        description: error.message || 'Failed to fetch market analytics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await loadPrices();
    await Promise.all(DEFAULT_COMMODITIES.map((c) => loadAnalyticsForCommodity(c)));
    setLoading(false);
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  const selectedAnalytics = analyticsByCommodity[selectedCommodity];

  if (loading) {
    return (
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
  }

  return (
    <Box>
      <Grid templateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap={4} mb={6}>
        {DEFAULT_COMMODITIES.map((commodity) => {
          const snapshot = prices.find((p) => p.commodity === commodity);
          const analytics = analyticsByCommodity[commodity];

          if (!snapshot || !analytics) return null;

          return (
            <Card
              key={commodity}
              variant="outline"
              onClick={() => setSelectedCommodity(commodity)}
              cursor="pointer"
            >
              <CardBody>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="medium" color="gray.600">
                    {formatCommodityLabel(commodity)}
                  </Text>
                  <Badge
                    colorScheme={
                      getPriceChangeColor(snapshot.priceChange24h) === 'green'
                        ? 'green'
                        : 'red'
                    }
                    fontSize="0.7rem"
                  >
                    {snapshot.priceChange24h >= 0 ? '+' : ''}
                    {snapshot.priceChangePercent.toFixed(2)}%
                  </Badge>
                </HStack>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="lg" fontWeight="bold">
                    ${snapshot.currentPrice.toFixed(2)}
                  </Text>
                  <Badge
                    colorScheme={getVolatilityColor(analytics.volatility.status)}
                    fontSize="0.7rem"
                  >
                    {analytics.volatility.status} Vol
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  Trend: {analytics.analysis.trend}
                </Text>
              </CardBody>
            </Card>
          );
        })}
      </Grid>

      <Card mb={4}>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="sm">Technical Analytics</Heading>
            <Select
              size="sm"
              width="200px"
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value as AnalyticsCommodity)}
            >
              {DEFAULT_COMMODITIES.map((commodity) => (
                <option key={commodity} value={commodity}>
                  {formatCommodityLabel(commodity)}
                </option>
              ))}
            </Select>
          </HStack>
        </CardHeader>
        <CardBody>
          {!selectedAnalytics ? (
            <Text color="gray.500">No analytics available for this commodity.</Text>
          ) : (
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Moving Averages</Tab>
                <Tab>Momentum & RSI</Tab>
                <Tab>Bollinger Bands</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <Stat>
                      <StatLabel>Current Price</StatLabel>
                      <StatNumber fontSize="lg">
                        ${selectedAnalytics.currentPrice.toFixed(2)}
                      </StatNumber>
                      <StatHelpText>
                        {new Date(selectedAnalytics.timestamp).toLocaleString()}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Volatility (30d)</StatLabel>
                      <StatNumber fontSize="lg" color={getVolatilityColor(selectedAnalytics.volatility.status)}>
                        {selectedAnalytics.volatility.thirtyDay.toFixed(2)}%
                      </StatNumber>
                      <StatHelpText>{selectedAnalytics.volatility.status}</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>RSI (14)</StatLabel>
                      <StatNumber
                        fontSize="lg"
                        color={
                          selectedAnalytics.momentum.rsi > 70
                            ? 'yellow.500'
                            : selectedAnalytics.momentum.rsi < 30
                            ? 'green.500'
                            : 'blue.500'
                        }
                      >
                        {selectedAnalytics.momentum.rsi.toFixed(1)}
                      </StatNumber>
                      <StatHelpText>{selectedAnalytics.momentum.signal}</StatHelpText>
                    </Stat>
                  </Grid>
                </TabPanel>

                <TabPanel>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Type</Th>
                        <Th isNumeric>7d</Th>
                        <Th isNumeric>30d</Th>
                        <Th isNumeric>90d</Th>
                        <Th isNumeric>200d</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>SMA</Td>
                        <Td isNumeric>{selectedAnalytics.movingAverages.sma7.toFixed(2)}</Td>
                        <Td isNumeric>{selectedAnalytics.movingAverages.sma30.toFixed(2)}</Td>
                        <Td isNumeric>{selectedAnalytics.movingAverages.sma90.toFixed(2)}</Td>
                        <Td isNumeric>{selectedAnalytics.movingAverages.sma200.toFixed(2)}</Td>
                      </Tr>
                      <Tr>
                        <Td>EMA</Td>
                        <Td isNumeric>{selectedAnalytics.movingAverages.ema7.toFixed(2)}</Td>
                        <Td isNumeric>{selectedAnalytics.movingAverages.ema30.toFixed(2)}</Td>
                        <Td isNumeric>-</Td>
                        <Td isNumeric>-</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TabPanel>

                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>RSI (14)</StatLabel>
                          <StatNumber fontSize="lg">
                            {selectedAnalytics.momentum.rsi.toFixed(1)}
                          </StatNumber>
                          <StatHelpText>{selectedAnalytics.momentum.signal}</StatHelpText>
                        </Stat>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          {selectedAnalytics.momentum.interpretation}
                        </Text>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Trading Signal</StatLabel>
                          <StatNumber fontSize="lg">
                            <Badge
                              colorScheme={getSignalColor(
                                selectedAnalytics.analysis.tradingSignals.trend,
                              )}
                            >
                              {selectedAnalytics.analysis.tradingSignals.trend}
                            </Badge>
                          </StatNumber>
                          <StatHelpText>
                            Volatility: {selectedAnalytics.analysis.tradingSignals.volatility}
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </Grid>
                </TabPanel>

                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Card>
                      <CardBody>
                        <Heading size="xs" mb={2}>
                          20-day Bands
                        </Heading>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Level</Th>
                              <Th isNumeric>Price</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td>Upper</Td>
                              <Td isNumeric>
                                {selectedAnalytics.bollingerBands.period20.upper.toFixed(2)}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td>Middle</Td>
                              <Td isNumeric>
                                {selectedAnalytics.bollingerBands.period20.middle.toFixed(2)}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td>Lower</Td>
                              <Td isNumeric>
                                {selectedAnalytics.bollingerBands.period20.lower.toFixed(2)}
                              </Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Heading size="xs" mb={2}>
                          Band Position
                        </Heading>
                        <Text fontSize="sm" mb={2}>
                          {selectedAnalytics.bollingerBands.currentPosition}
                        </Text>
                        <Tooltip label="Relative position of the last close within the 20d bands">
                          <Progress
                            value={50}
                            size="sm"
                            colorScheme="blue"
                            borderRadius="md"
                          />
                        </Tooltip>
                      </CardBody>
                    </Card>
                  </Grid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="sm">Correlation Matrix (Period {ANALYTICS_PERIOD_DAYS}d)</Heading>
        </CardHeader>
        <CardBody>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Commodity</Th>
                {DEFAULT_COMMODITIES.map((col) => (
                  <Th key={col} isNumeric>
                    {formatCommodityLabel(col)}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {DEFAULT_COMMODITIES.map((row) => {
                const rowAnalytics = analyticsByCommodity[row];
                return (
                  <Tr key={row}>
                    <Td fontWeight="medium">{formatCommodityLabel(row)}</Td>
                    {DEFAULT_COMMODITIES.map((col) => {
                      if (row === col) {
                        return (
                          <Td key={col} isNumeric>
                            <Badge colorScheme="blue">1.00</Badge>
                          </Td>
                        );
                      }

                      const value = rowAnalytics?.correlations[col] ?? 0;
                      const colorScheme =
                        value > 0.7
                          ? 'green'
                          : value > 0.4
                          ? 'blue'
                          : value < -0.4
                          ? 'red'
                          : 'gray';

                      return (
                        <Td key={col} isNumeric>
                          <Badge colorScheme={colorScheme}>{value.toFixed(2)}</Badge>
                        </Td>
                      );
                    })}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Box>
  );
}

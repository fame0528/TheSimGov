/**
 * @file src/components/energy/PerformanceMetrics.tsx
 * @description Cross-domain performance and KPI dashboard for the Energy business
 * @created 2025-11-18
 *
 * OVERVIEW:
 * Integration component that surfaces the most important KPIs from Oil & Gas, Renewables,
 * Trading and Grid Infrastructure into a single glanceable dashboard. It focuses on
 * profitability, operational efficiency, reliability, compliance and sustainability to
 * give executives a balanced scorecard for the entire Energy portfolio.
 *
 * COMPONENT ARCHITECTURE:
 * - Profitability: Revenue, profit and margin by major segment
 * - Operations: Capacity utilization, grid stability, reserve margin
 * - Trading: Portfolio P&L and risk indicators
 * - Sustainability: Renewable share and carbon offset progress
 * - Compliance: Environmental alerts and blackout risk bands
 *
 * STATE MANAGEMENT:
 * - metrics: Aggregated metrics payload from backend
 * - loading: Initial load state
 *
 * API INTEGRATION (contract):
 * - GET /api/energy/performance-metrics?company={companyId}
 *   Response shape is defined by the `PerformanceMetricsPayload` interface below.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  VStack,
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Skeleton,
  useToast,
} from '@chakra-ui/react';

interface SegmentProfitability {
  segment: 'OilGas' | 'Renewables' | 'Trading' | 'Grid';
  revenue: number;
  profit: number;
  marginPercent: number;
}

interface OperationsMetrics {
  gridStabilityIndex: number;
  blackoutRisk: number;
  reserveMarginPercent: number;
  averagePlantUtilizationPercent: number;
}

interface TradingMetrics {
  unrealizedPnL: number;
  realizedPnL: number;
  marginUsed: number;
  marginUtilizationPercent: number;
  highRiskInstruments: number;
}

interface SustainabilityMetrics {
  renewableCapacityMw: number;
  fossilCapacityMw: number;
  renewableSharePercent: number;
  carbonOffsetTons: number;
  carbonTargetTons: number;
}

interface ComplianceAlert {
  id: string;
  level: 'Info' | 'Warning' | 'Critical';
  message: string;
}

interface PerformanceMetricsPayload {
  companyId: string;
  periodLabel: string;
  profitBySegment: SegmentProfitability[];
  operations: OperationsMetrics;
  trading: TradingMetrics;
  sustainability: SustainabilityMetrics;
  complianceAlerts: ComplianceAlert[];
}

interface PerformanceMetricsProps {
  companyId: string;
}

const formatSegmentLabel = (segment: SegmentProfitability['segment']): string => {
  switch (segment) {
    case 'OilGas':
      return 'Oil & Gas';
    case 'Renewables':
      return 'Renewables';
    case 'Trading':
      return 'Trading';
    case 'Grid':
      return 'Grid Infrastructure';
    default:
      return segment;
  }
};

const getMarginColor = (margin: number): string => {
  if (margin >= 25) return 'green';
  if (margin >= 10) return 'blue';
  if (margin >= 0) return 'yellow';
  return 'red';
};

const getAlertColor = (level: ComplianceAlert['level']): 'blue' | 'yellow' | 'red' => {
  switch (level) {
    case 'Info':
      return 'blue';
    case 'Warning':
      return 'yellow';
    case 'Critical':
      return 'red';
    default:
      return 'blue';
  }
};

const getBlackoutColor = (risk: number): string => {
  if (risk <= 20) return 'green';
  if (risk <= 40) return 'blue';
  if (risk <= 60) return 'yellow';
  if (risk <= 80) return 'orange';
  return 'red';
};

const getReserveColor = (reserve: number): string => {
  if (reserve >= 15) return 'green';
  if (reserve >= 10) return 'yellow';
  return 'red';
};

const getRenewableColor = (share: number): string => {
  if (share >= 60) return 'green';
  if (share >= 40) return 'blue';
  if (share >= 20) return 'yellow';
  return 'red';
};

/**
 * PerformanceMetrics component
 *
 * @description
 * Cross-domain Energy performance dashboard combining financial, operational, trading,
 * sustainability and compliance metrics into a single KPI view.
 */
export default function PerformanceMetrics({
  companyId,
}: PerformanceMetricsProps): JSX.Element {
  const toast = useToast();
  const [metrics, setMetrics] = useState<PerformanceMetricsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/energy/performance-metrics?company=${companyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch performance metrics');
      }

      setMetrics(data as PerformanceMetricsPayload);
    } catch (error: any) {
      toast({
        title: 'Error loading performance metrics',
        description: error.message || 'Network error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, [companyId]);

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

  if (!metrics) {
    return (
      <Alert status="info">
        <AlertIcon />
        <AlertDescription>
          No performance metrics available yet. Create energy assets and run operations to
          generate performance data.
        </AlertDescription>
      </Alert>
    );
  }

  const totalRevenue = metrics.profitBySegment.reduce((sum, seg) => sum + seg.revenue, 0);
  const totalProfit = metrics.profitBySegment.reduce((sum, seg) => sum + seg.profit, 0);

  const carbonProgress = Math.min(
    metrics.sustainability.carbonTargetTons > 0
      ? (metrics.sustainability.carbonOffsetTons / metrics.sustainability.carbonTargetTons) * 100
      : 0,
    150,
  );

  return (
    <Box>
      {metrics.complianceAlerts.some((a) => a.level === 'Critical') && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Critical compliance or reliability issues detected</AlertTitle>
            <AlertDescription>
              Review the Compliance tab and environmental dashboards to address issues
              before they impact operations.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Grid templateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue ({metrics.periodLabel})</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                ${totalRevenue.toLocaleString()}
              </StatNumber>
              <StatHelpText>Across all energy segments</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Profit ({metrics.periodLabel})</StatLabel>
              <StatNumber
                fontSize="lg"
                color={totalProfit >= 0 ? 'green.500' : 'red.500'}
              >
                {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString()}
              </StatNumber>
              <StatHelpText>
                Margin ~
                {totalRevenue > 0
                  ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                  : '0.0'}
                %
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Grid Stability Index</StatLabel>
              <StatNumber
                fontSize="lg"
                color={
                  metrics.operations.gridStabilityIndex >= 80 ? 'green.500' : 'yellow.500'
                }
              >
                {metrics.operations.gridStabilityIndex.toFixed(0)}
              </StatNumber>
              <StatHelpText>N-1 secure if &gt;= 80</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Renewable Share of Capacity</StatLabel>
              <StatNumber
                fontSize="lg"
                color={getRenewableColor(metrics.sustainability.renewableSharePercent)}
              >
                {metrics.sustainability.renewableSharePercent.toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                {metrics.sustainability.renewableCapacityMw.toLocaleString()} MW renewable /{' '}
                {(
                  metrics.sustainability.renewableCapacityMw +
                  metrics.sustainability.fossilCapacityMw
                ).toLocaleString()}{' '}
                MW total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>Profitability</Tab>
          <Tab>Operations</Tab>
          <Tab>Trading</Tab>
          <Tab>Sustainability</Tab>
          <Tab>Compliance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Segment Profitability</Heading>
              </CardHeader>
              <CardBody>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Segment</Th>
                      <Th isNumeric>Revenue</Th>
                      <Th isNumeric>Profit</Th>
                      <Th isNumeric>Margin</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {metrics.profitBySegment.map((seg) => (
                      <Tr key={seg.segment}>
                        <Td fontWeight="medium">{formatSegmentLabel(seg.segment)}</Td>
                        <Td isNumeric color="green.500">
                          ${seg.revenue.toLocaleString()}
                        </Td>
                        <Td isNumeric color={seg.profit >= 0 ? 'green.500' : 'red.500'}>
                          {seg.profit >= 0 ? '+' : '-'}$
                          {Math.abs(seg.profit).toLocaleString()}
                        </Td>
                        <Td isNumeric>
                          <Badge colorScheme={getMarginColor(seg.marginPercent)} size="sm">
                            {seg.marginPercent.toFixed(1)}%
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap={4}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Blackout Risk</StatLabel>
                    <StatNumber
                      fontSize="lg"
                      color={getBlackoutColor(metrics.operations.blackoutRisk)}
                    >
                      {metrics.operations.blackoutRisk.toFixed(0)}
                    </StatNumber>
                    <StatHelpText>
                      <Progress
                        value={metrics.operations.blackoutRisk}
                        size="sm"
                        colorScheme={getBlackoutColor(metrics.operations.blackoutRisk)}
                        borderRadius="md"
                      />
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Reserve Margin</StatLabel>
                    <StatNumber
                      fontSize="lg"
                      color={getReserveColor(metrics.operations.reserveMarginPercent)}
                    >
                      {metrics.operations.reserveMarginPercent.toFixed(1)}%
                    </StatNumber>
                    <StatHelpText>Target 15–20%</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Average Plant Utilization</StatLabel>
                    <StatNumber fontSize="lg">
                      {metrics.operations.averagePlantUtilizationPercent.toFixed(1)}%
                    </StatNumber>
                    <StatHelpText>Across all generation assets</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap={4}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Unrealized P&amp;L</StatLabel>
                    <StatNumber
                      fontSize="lg"
                      color={metrics.trading.unrealizedPnL >= 0 ? 'green.500' : 'red.500'}
                    >
                      {metrics.trading.unrealizedPnL >= 0 ? '+' : '-'}$
                      {Math.abs(metrics.trading.unrealizedPnL).toLocaleString()}
                    </StatNumber>
                    <StatHelpText>Open positions</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Realized P&amp;L</StatLabel>
                    <StatNumber
                      fontSize="lg"
                      color={metrics.trading.realizedPnL >= 0 ? 'green.500' : 'red.500'}
                    >
                      {metrics.trading.realizedPnL >= 0 ? '+' : '-'}$
                      {Math.abs(metrics.trading.realizedPnL).toLocaleString()}
                    </StatNumber>
                    <StatHelpText>Closed trades this period</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Margin Utilization</StatLabel>
                    <StatNumber fontSize="lg">
                      {metrics.trading.marginUtilizationPercent.toFixed(1)}%
                    </StatNumber>
                    <StatHelpText>
                      ${metrics.trading.marginUsed.toLocaleString()} used margin
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>High-Risk Instruments</StatLabel>
                    <StatNumber
                      fontSize="lg"
                      color={metrics.trading.highRiskInstruments > 0 ? 'red.500' : 'green.500'}
                    >
                      {metrics.trading.highRiskInstruments}
                    </StatNumber>
                    <StatHelpText>
                      Positions with extreme volatility or leverage
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap={4}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Renewable Capacity</StatLabel>
                    <StatNumber fontSize="lg" color="green.500">
                      {metrics.sustainability.renewableCapacityMw.toLocaleString()} MW
                    </StatNumber>
                    <StatHelpText>
                      vs {metrics.sustainability.fossilCapacityMw.toLocaleString()} MW fossil
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Carbon Offset Progress</StatLabel>
                    <StatNumber fontSize="lg">
                      {metrics.sustainability.carbonOffsetTons.toLocaleString()} tons
                    </StatNumber>
                    <StatHelpText>
                      Target {metrics.sustainability.carbonTargetTons.toLocaleString()} tons
                    </StatHelpText>
                  </Stat>
                  <Progress
                    mt={2}
                    value={carbonProgress}
                    max={100}
                    size="sm"
                    colorScheme={getRenewableColor(carbonProgress)}
                    borderRadius="md"
                  />
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              {metrics.complianceAlerts.length === 0 ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    No active compliance or reliability alerts. Keep monitoring grid
                    analytics and environmental dashboards.
                  </AlertDescription>
                </Alert>
              ) : (
                metrics.complianceAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    status={
                      getAlertColor(alert.level) === 'red'
                        ? 'error'
                        : getAlertColor(alert.level) === 'yellow'
                        ? 'warning'
                        : 'info'
                    }
                    borderRadius="md"
                  >
                    <AlertIcon />
                    <Box>
                      <AlertTitle>{alert.level}</AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Box>
                  </Alert>
                ))
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

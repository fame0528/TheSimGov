/**
 * @file components/energy/EnergyDashboardClient.tsx
 * @description Client-side Energy dashboard with 8-tab integration and stats overview
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Client component for Energy industry dashboard providing interactive tabbed navigation
 * across all energy business units. Displays aggregate statistics in overview cards and
 * integrates 8 specialized components for comprehensive energy operations management.
 * 
 * COMPONENT ARCHITECTURE:
 * - Overview cards: Total revenue, profit margin, active operations, renewable percentage
 * - Tabbed interface: 8 tabs for different energy business areas
 * - Lazy loading: Components loaded on demand (optional future optimization)
 * - State management: Tab selection, stats data
 * 
 * TAB STRUCTURE:
 * 1. Oil & Gas - OilGasOperations component
 * 2. Renewables - RenewableEnergyDashboard component
 * 3. Trading - CommodityTradingPanel component
 * 4. Grid - GridInfrastructureDashboard component
 * 5. Compliance - EnvironmentalCompliance component
 * 6. Portfolio - EnergyPortfolio component
 * 7. Analytics - MarketAnalytics component
 * 8. Performance - PerformanceMetrics component
 * 
 * PROPS:
 * - companyId: Company ID for data lookup
 * 
 * IMPLEMENTATION NOTES:
 * - Uses Chakra UI Tabs with enclosed variant
 * - Color scheme: teal (energy industry standard)
 * - Stats fetched from portfolio endpoint for efficiency
 * - Tab indices: 0-7 for 8 tabs
 * - Responsive grid: 2x2 on desktop, stack on mobile
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import OilGasOperations from '@/src/components/energy/OilGasOperations';
import RenewableEnergyDashboard from '@/src/components/energy/RenewableEnergyDashboard';
import CommodityTradingPanel from '@/src/components/energy/CommodityTradingPanel';
import GridInfrastructureDashboard from '@/src/components/energy/GridInfrastructureDashboard';
import EnvironmentalCompliance from '@/src/components/energy/EnvironmentalCompliance';
import EnergyPortfolio from '@/src/components/energy/EnergyPortfolio';
import MarketAnalytics from '@/src/components/energy/MarketAnalytics';
import PerformanceMetrics from '@/src/components/energy/PerformanceMetrics';

/**
 * Stats data interface
 */
interface EnergyStats {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  activeOperations: number;
  renewablePercent: number;
}

/**
 * EnergyDashboardClient component props
 */
interface EnergyDashboardClientProps {
  companyId: string;
}

/**
 * EnergyDashboardClient component
 * 
 * @description
 * Client-side Energy dashboard with stats overview and 8-tab navigation
 * for comprehensive energy business management
 * 
 * @param {EnergyDashboardClientProps} props - Component props
 * @returns {JSX.Element} EnergyDashboardClient component
 */
export default function EnergyDashboardClient({
  companyId,
}: EnergyDashboardClientProps): JSX.Element {
  const toast = useToast();
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetch aggregate stats for overview cards
   */
  const fetchStats = async () => {
    setLoading(true);
    try {
      // Use portfolio endpoint for aggregate stats (most efficient)
      const response = await fetch(`/api/energy/portfolio?company=${companyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      // Calculate stats from portfolio data
      const totalRevenue = data.revenue || 0;
      const totalProfit = data.profit || 0;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Count active operations from category breakdown
      const activeOperations = data.categoryBreakdown?.length || 0;

      // Get renewable percentage from category breakdown
      const renewablesCategory = data.categoryBreakdown?.find(
        (cat: any) => cat.category === 'Renewables'
      );
      const renewablePercent = renewablesCategory
        ? data.assetAllocation?.Renewables || 0
        : 0;

      setStats({
        totalRevenue,
        totalProfit,
        profitMargin,
        activeOperations,
        renewablePercent,
      });
    } catch (error: any) {
      toast({
        title: 'Error loading stats',
        description: error.message || 'Failed to fetch energy stats',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch stats on mount
   */
  useEffect(() => {
    fetchStats();
  }, [companyId]);

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
      <Skeleton height="120px" borderRadius="md" />
      <Skeleton height="120px" borderRadius="md" />
      <Skeleton height="120px" borderRadius="md" />
      <Skeleton height="120px" borderRadius="md" />
    </Grid>
  );

  return (
    <Container maxW="container.xl" py={8}>
      {/* Page Header */}
      <Box mb={8}>
        <Heading size="xl" mb={2}>
          Energy Dashboard
        </Heading>
        <Text color="gray.600">
          Comprehensive energy operations management across Oil & Gas, Renewables, Trading, and Grid Infrastructure
        </Text>
      </Box>

      {/* Stats Overview Cards */}
      {loading ? (
        renderSkeletons()
      ) : stats ? (
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
          {/* Total Revenue */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber fontSize="2xl" color="green.500">
                  ${stats.totalRevenue.toLocaleString()}
                </StatNumber>
                <StatHelpText>Monthly aggregate across all operations</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Profit Margin */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Profit Margin</StatLabel>
                <StatNumber
                  fontSize="2xl"
                  color={stats.profitMargin > 15 ? 'green.500' : stats.profitMargin > 0 ? 'blue.500' : 'red.500'}
                >
                  {stats.profitMargin.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  ${Math.abs(stats.totalProfit).toLocaleString()} {stats.totalProfit >= 0 ? 'profit' : 'loss'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Active Operations */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Operations</StatLabel>
                <StatNumber fontSize="2xl" color="blue.500">
                  {stats.activeOperations}
                </StatNumber>
                <StatHelpText>Energy business units operating</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Renewable Energy % */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Renewable Energy</StatLabel>
                <StatNumber
                  fontSize="2xl"
                  color={stats.renewablePercent > 40 ? 'green.500' : stats.renewablePercent > 20 ? 'blue.500' : 'orange.500'}
                >
                  {stats.renewablePercent.toFixed(1)}%
                </StatNumber>
                <StatHelpText>Of total energy portfolio</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">No energy operations found. Create energy assets to get started.</Text>
        </Box>
      )}

      {/* Tabbed Interface - 8 Energy Components */}
      <Card>
        <CardBody p={0}>
          <Tabs variant="enclosed" colorScheme="teal" isLazy>
            <TabList px={4} pt={4}>
              <Tab>Oil & Gas</Tab>
              <Tab>Renewables</Tab>
              <Tab>Trading</Tab>
              <Tab>Grid</Tab>
              <Tab>Compliance</Tab>
              <Tab>Portfolio</Tab>
              <Tab>Analytics</Tab>
              <Tab>Performance</Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Oil & Gas Operations */}
              <TabPanel p={6}>
                <OilGasOperations companyId={companyId} />
              </TabPanel>

              {/* Tab 2: Renewable Energy Dashboard */}
              <TabPanel p={6}>
                <RenewableEnergyDashboard companyId={companyId} />
              </TabPanel>

              {/* Tab 3: Commodity Trading Panel */}
              <TabPanel p={6}>
                <CommodityTradingPanel companyId={companyId} />
              </TabPanel>

              {/* Tab 4: Grid Infrastructure Dashboard */}
              <TabPanel p={6}>
                <GridInfrastructureDashboard companyId={companyId} />
              </TabPanel>

              {/* Tab 5: Environmental Compliance */}
              <TabPanel p={6}>
                <EnvironmentalCompliance companyId={companyId} />
              </TabPanel>

              {/* Tab 6: Energy Portfolio */}
              <TabPanel p={6}>
                <EnergyPortfolio companyId={companyId} />
              </TabPanel>

              {/* Tab 7: Market Analytics */}
              <TabPanel p={6}>
                <MarketAnalytics />
              </TabPanel>

              {/* Tab 8: Performance Metrics */}
              <TabPanel p={6}>
                <PerformanceMetrics companyId={companyId} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Container>
  );
}

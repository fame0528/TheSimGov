/**
 * @file app/(game)/companies/[id]/manufacturing/page.tsx
 * @description Manufacturing dashboard page with production overview
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Main manufacturing dashboard displaying facilities, production lines, and key
 * performance metrics. Provides overview of manufacturing operations including
 * OEE trends, capacity utilization, and production status across all facilities.
 * 
 * FEATURES:
 * - Facility list with capacity and OEE metrics
 * - Production line status overview
 * - Key performance indicators (KPIs): Overall OEE, Capacity Utilization, Active Lines
 * - Quick stats: Total facilities, total lines, average OEE
 * - Navigation to detailed views (inventory, supply chain, quality control)
 * - Real-time data fetching with error handling
 */

'use client';

import React, { use, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FacilityCard, ProductionLineCard } from '../../../../../src/components/manufacturing';

/**
 * Manufacturing dashboard page component
 */
export default function ManufacturingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [productionLines, setProductionLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch facilities and production lines
   */
  useEffect(() => {
    const fetchManufacturingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch facilities
        const facilitiesRes = await fetch(`/api/manufacturing/facilities?limit=10`);
        if (!facilitiesRes.ok) {
          throw new Error('Failed to fetch facilities');
        }
        const facilitiesData = await facilitiesRes.json();

        // Fetch production lines
        const linesRes = await fetch(`/api/manufacturing/production-lines?limit=10`);
        if (!linesRes.ok) {
          throw new Error('Failed to fetch production lines');
        }
        const linesData = await linesRes.json();

        setFacilities(facilitiesData.facilities || []);
        setProductionLines(linesData.productionLines || []);
      } catch (err: any) {
        console.error('Manufacturing data fetch error:', err);
        setError(err.message || 'Failed to load manufacturing data');
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturingData();
  }, []);

  /**
   * Calculate summary statistics
   */
  const stats = React.useMemo(() => {
    const totalFacilities = facilities.length;
    const totalLines = productionLines.length;
    const activeLines = productionLines.filter(line => line.status === 'Running').length;

    // Calculate average OEE
    const avgOEE =
      facilities.length > 0
        ? facilities.reduce((sum, f) => sum + (f.oee || 0), 0) / facilities.length
        : 0;

    // Calculate average capacity utilization
    const avgUtilization =
      facilities.length > 0
        ? facilities.reduce((sum, f) => sum + (f.capacity?.utilization || 0), 0) / facilities.length
        : 0;

    return {
      totalFacilities,
      totalLines,
      activeLines,
      avgOEE,
      avgUtilization,
    };
  }, [facilities, productionLines]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Heading size="lg" color="white">
            Manufacturing Dashboard
          </Heading>
          <Spinner size="xl" color="picton_blue.500" />
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" bg="night.400" borderColor="red.500" borderWidth="1px" borderRadius="2xl">
          <AlertIcon />
          <Box>
            <AlertTitle>Error Loading Manufacturing Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color="white" mb={2}>
            Manufacturing Dashboard
          </Heading>
          <Text color="ash_gray.400">
            Production overview and facility management
          </Text>
        </Box>

        {/* Summary Statistics */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Total Facilities</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {stats.totalFacilities}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Production Lines</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {stats.activeLines}/{stats.totalLines}
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">Active</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Average OEE</StatLabel>
                  <StatNumber
                    color={stats.avgOEE >= 85 ? 'green.400' : stats.avgOEE >= 70 ? 'yellow.400' : 'red.400'}
                    fontSize="3xl"
                  >
                    {stats.avgOEE.toFixed(1)}%
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">
                    {stats.avgOEE >= 85 ? 'World Class' : stats.avgOEE >= 70 ? 'Good' : 'Needs Improvement'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Capacity Utilization</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {stats.avgUtilization.toFixed(1)}%
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Quick Actions */}
        <HStack spacing={4}>
          <Button
            colorScheme="blue"
            onClick={() => router.push(`/companies/${unwrappedParams.id}/manufacturing/inventory`)}
          >
            Inventory Management
          </Button>
          <Button
            colorScheme="green"
            onClick={() => router.push(`/companies/${unwrappedParams.id}/manufacturing/supply-chain`)}
          >
            Supply Chain
          </Button>
          <Button variant="outline" colorScheme="gray">
            Quality Control
          </Button>
          <Button variant="outline" colorScheme="gray">
            Production Scheduler
          </Button>
        </HStack>

        {/* Facilities and Production Lines Tabs */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab color="ash_gray.400" _selected={{ color: 'white', borderColor: 'picton_blue.500' }}>
              Facilities ({facilities.length})
            </Tab>
            <Tab color="ash_gray.400" _selected={{ color: 'white', borderColor: 'picton_blue.500' }}>
              Production Lines ({productionLines.length})
            </Tab>
          </TabList>

          <TabPanels>
            {/* Facilities Tab */}
            <TabPanel px={0}>
              {facilities.length === 0 ? (
                <Alert status="info" bg="night.400" borderColor="picton_blue.500" borderWidth="1px" borderRadius="2xl">
                  <AlertIcon />
                  <AlertDescription>
                    No manufacturing facilities found. Create your first facility to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
                  {facilities.map((facility) => (
                    <GridItem key={facility._id}>
                      <FacilityCard
                        facility={facility}
                        onClick={(id: string) => router.push(`/companies/${unwrappedParams.id}/manufacturing/facilities/${id}`)}
                      />
                    </GridItem>
                  ))}
                </Grid>
              )}
            </TabPanel>

            {/* Production Lines Tab */}
            <TabPanel px={0}>
              {productionLines.length === 0 ? (
                <Alert status="info" bg="night.400" borderColor="picton_blue.500" borderWidth="1px" borderRadius="2xl">
                  <AlertIcon />
                  <AlertDescription>
                    No production lines found. Add production lines to your facilities to begin manufacturing.
                  </AlertDescription>
                </Alert>
              ) : (
                <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
                  {productionLines.map((line) => (
                    <GridItem key={line._id}>
                      <ProductionLineCard
                        line={line}
                        onClick={(id: string) => router.push(`/companies/${unwrappedParams.id}/manufacturing/lines/${id}`)}
                      />
                    </GridItem>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

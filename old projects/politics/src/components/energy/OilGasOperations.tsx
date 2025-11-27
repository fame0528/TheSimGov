/**
 * @file src/components/energy/OilGasOperations.tsx
 * @description Oil & Gas operations management dashboard for Energy companies
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Comprehensive Oil & Gas operations dashboard enabling Energy companies to manage oil wells,
 * gas fields, extraction sites, reserves, and storage facilities. Displays real-time production
 * metrics, depletion tracking, maintenance scheduling, quality grading, inventory management,
 * and revenue optimization. Integrates extraction mechanics with commodity pricing for profitability
 * analysis and operational decision support.
 * 
 * COMPONENT ARCHITECTURE:
 * - Wells overview: Production rates, depletion status, maintenance schedule
 * - Gas fields dashboard: Pressure dynamics, quality grades (Pipeline/Plant/Sour), production forecasts
 * - Extraction sites: Multi-well operations, daily throughput, inventory levels
 * - Reserves tracking: SEC classifications (Proved/Probable/Possible), PV-10 valuations
 * - Storage facilities: Capacity utilization, quality segregation, transfer operations
 * - Operations controls: Extract, maintain, upgrade equipment, adjust production
 * - Analytics display: Revenue per barrel/MCF, operating margins, depletion forecasts
 * 
 * STATE MANAGEMENT:
 * - wells: Array of OilWell documents with production data
 * - gasFields: Array of GasField documents with pressure/quality data
 * - extractionSites: Array of ExtractionSite documents with multi-well operations
 * - reserves: Reserve estimates with SEC classifications
 * - storage: Storage facility data with inventory tracking
 * - loading: Loading state during initial fetch
 * - isOperating: Operation in progress state
 * - selectedAsset: Currently selected well/field/site for detailed view
 * 
 * API INTEGRATION:
 * - GET /api/energy/oil-wells - Fetch company's oil wells
 *   Response: { wells: OilWell[], totalProduction, avgDepletion, maintenanceDue }
 * - GET /api/energy/gas-fields - Fetch company's gas fields
 *   Response: { fields: GasField[], totalProduction, pressureStatus, qualityMix }
 * - GET /api/energy/extraction-sites - Fetch company's extraction sites
 *   Response: { sites: ExtractionSite[], dailyThroughput, inventoryValue }
 * - GET /api/energy/reserves - Fetch reserve estimates
 *   Response: { reserves: Reserve[], pv10Value, riskCategories }
 * - GET /api/energy/storage - Fetch storage facilities
 *   Response: { facilities: Storage[], utilization, inventoryValue }
 * - POST /api/energy/oil-wells/[id]/extract - Run extraction operation
 *   Request: { duration: number }
 *   Response: { production, revenue, depletionIncrease, newStatus }
 * - POST /api/energy/oil-wells/[id]/maintain - Perform maintenance
 *   Request: { maintenanceType: 'Routine' | 'Major' | 'Emergency' }
 *   Response: { cost, efficiency Improvement, nextMaintenanceDue }
 * - POST /api/energy/gas-fields/[id]/update-pressure - Adjust gas field pressure
 *   Request: { pressureChange: number }
 *   Response: { newPressure, productionImpact, qualityChange }
 * 
 * PROPS:
 * - companyId: Company ID for asset lookup
 * 
 * USAGE:
 * ```tsx
 * <OilGasOperations companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Production calculation: peakProduction × (1 - depletionRate)^(daysActive/365)
 * - Revenue formula: (currentProduction × price) - (currentProduction × extractionCost)
 * - Depletion tracking: Daily depletion increases based on extraction intensity
 * - Maintenance scheduling: Every 90 days routine, equipment degrades 0.5%/month
 * - Quality grading impact:
 *   - Pipeline quality: +15-20% price premium
 *   - Plant quality: Baseline pricing
 *   - Sour quality: -20-25% price penalty
 * - Weather impact (offshore): Storms reduce production 40-80%
 * - Reserve classifications:
 *   - Proved (P1): 90%+ certainty of recovery
 *   - Probable (P2): 50%+ certainty
 *   - Possible (P3): 10%+ certainty
 * - PV-10 calculation: Net present value of proved reserves at 10% discount rate
 * - Storage costs: $0.50-$3.00/barrel/month (oil), $0.10-$0.50/MCF/month (gas)
 * - FIFO inventory rotation for storage facilities
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
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Select,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';

/**
 * Well status enum
 */
type WellStatus = 'Drilling' | 'Active' | 'Depleted' | 'Maintenance' | 'Abandoned';

/**
 * Well type enum
 */
type WellType = 'Conventional' | 'Unconventional' | 'Offshore' | 'Shale';

/**
 * Gas quality grade enum
 */
type QualityGrade = 'Pipeline' | 'Plant' | 'Sour';

/**
 * OilWell interface
 */
interface OilWell {
  _id: string;
  company: string;
  name: string;
  wellType: WellType;
  status: WellStatus;
  location: {
    latitude: number;
    longitude: number;
    region: string;
    isOffshore: boolean;
  };
  peakProduction: number;
  currentProduction: number;
  depletionRate: number;
  reserveEstimate: number;
  daysActive: number;
  lastMaintenanceDate: Date;
  equipment: {
    efficiency: number;
    age: number;
    cost: number;
  };
  extractionCost: number;
  oilPrice: number;
  revenue: number;
  isDepleted: boolean;
  nextMaintenanceDue?: Date;
}

/**
 * GasField interface
 */
interface GasField {
  _id: string;
  company: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  reserveEstimate: number;
  currentProduction: number;
  pressure: number;
  qualityGrade: QualityGrade;
  depletionRate: number;
  gasPrice: number;
  revenue: number;
  operatingCost: number;
}

/**
 * ExtractionSite interface
 */
interface ExtractionSite {
  _id: string;
  company: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  wells: string[];
  dailyThroughput: number;
  storageCapacity: number;
  currentInventory: number;
  operatingCost: number;
  revenue: number;
}

/**
 * Reserve interface
 */
interface Reserve {
  _id: string;
  company: string;
  commodity: 'Oil' | 'Gas';
  classification: 'Proved' | 'Probable' | 'Possible';
  quantity: number;
  pv10Value: number;
  certificationDate: Date;
}

/**
 * Storage facility interface
 */
interface Storage {
  _id: string;
  company: string;
  name: string;
  facilityType: string;
  commodity: 'Oil' | 'Gas' | 'NGL';
  capacity: number;
  currentInventory: number;
  qualityGrade: string;
  storageCost: number;
  utilizationPercent: number;
}

/**
 * OilGasOperations component props
 */
interface OilGasOperationsProps {
  companyId: string;
}

/**
 * OilGasOperations component
 * 
 * @description
 * Oil & Gas operations management dashboard for Energy companies with production
 * tracking, maintenance scheduling, quality management, and revenue optimization
 * 
 * @param {OilGasOperationsProps} props - Component props
 * @returns {JSX.Element} OilGasOperations component
 */
export default function OilGasOperations({
  companyId,
}: OilGasOperationsProps): JSX.Element {
  const toast = useToast();
  const { isOpen: isExtractOpen, onOpen: onExtractOpen, onClose: onExtractClose } = useDisclosure();
  const { isOpen: isMaintainOpen, onOpen: onMaintainOpen, onClose: onMaintainClose } = useDisclosure();

  // State management
  const [wells, setWells] = useState<OilWell[]>([]);
  const [gasFields, setGasFields] = useState<GasField[]>([]);
  const [extractionSites, setExtractionSites] = useState<ExtractionSite[]>([]);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [storage, setStorage] = useState<Storage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOperating, setIsOperating] = useState<boolean>(false);
  const [selectedWell, setSelectedWell] = useState<OilWell | null>(null);
  const [extractionDuration, setExtractionDuration] = useState<number>(24);
  const [maintenanceType, setMaintenanceType] = useState<string>('Routine');

  /**
   * Fetch all oil & gas data
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [wellsRes, gasRes, sitesRes, reservesRes, storageRes] = await Promise.all([
        fetch(`/api/energy/oil-wells?company=${companyId}`),
        fetch(`/api/energy/gas-fields?company=${companyId}`),
        fetch(`/api/energy/extraction-sites?company=${companyId}`),
        fetch(`/api/energy/reserves?company=${companyId}`),
        fetch(`/api/energy/storage?company=${companyId}`),
      ]);

      const [wellsData, gasData, sitesData, reservesData, storageData] = await Promise.all([
        wellsRes.json(),
        gasRes.json(),
        sitesRes.json(),
        reservesRes.json(),
        storageRes.json(),
      ]);

      setWells(wellsData.wells || []);
      setGasFields(gasData.fields || []);
      setExtractionSites(sitesData.sites || []);
      setReserves(reservesData.reserves || []);
      setStorage(storageData.facilities || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to fetch operations data',
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
   * Handle extraction operation
   */
  const handleExtract = async () => {
    if (!selectedWell) return;

    setIsOperating(true);
    try {
      const response = await fetch(`/api/energy/oil-wells/${selectedWell._id}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: extractionDuration }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Extraction complete',
          description: `Produced ${data.production?.toLocaleString()} barrels, Revenue: $${data.revenue?.toLocaleString()}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Refresh data
        fetchData();
        onExtractClose();
      } else {
        toast({
          title: 'Extraction failed',
          description: data.error || 'Operation failed',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Handle maintenance operation
   */
  const handleMaintenance = async () => {
    if (!selectedWell) return;

    setIsOperating(true);
    try {
      const response = await fetch(`/api/energy/oil-wells/${selectedWell._id}/maintain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceType }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Maintenance complete',
          description: `Cost: $${data.cost?.toLocaleString()}, Efficiency: +${data.efficiencyImprovement}%`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Refresh data
        fetchData();
        onMaintainClose();
      } else {
        toast({
          title: 'Maintenance failed',
          description: data.error || 'Operation failed',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsOperating(false);
    }
  };

  /**
   * Calculate total production
   */
  const totalOilProduction = wells.reduce((sum, well) => sum + well.currentProduction, 0);
  const totalGasProduction = gasFields.reduce((sum, field) => sum + field.currentProduction, 0);
  const totalRevenue = wells.reduce((sum, well) => sum + well.revenue, 0) +
    gasFields.reduce((sum, field) => sum + field.revenue, 0);
  const avgDepletion = wells.length > 0
    ? wells.reduce((sum, well) => sum + well.depletionRate, 0) / wells.length
    : 0;

  /**
   * Get status badge color
   */
  const getStatusColor = (status: WellStatus): string => {
    switch (status) {
      case 'Active': return 'green';
      case 'Drilling': return 'blue';
      case 'Maintenance': return 'yellow';
      case 'Depleted': return 'red';
      case 'Abandoned': return 'gray';
      default: return 'gray';
    }
  };

  /**
   * Get quality grade color
   */
  const getQualityColor = (grade: QualityGrade): string => {
    switch (grade) {
      case 'Pipeline': return 'green';
      case 'Plant': return 'blue';
      case 'Sour': return 'orange';
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

  return (
    <Box>
      {/* Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Oil Production</StatLabel>
              <StatNumber fontSize="lg">{totalOilProduction.toLocaleString()} bbl/day</StatNumber>
              <StatHelpText>
                <StatArrow type={avgDepletion < 5 ? 'increase' : 'decrease'} />
                {avgDepletion.toFixed(2)}% depletion
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Gas Production</StatLabel>
              <StatNumber fontSize="lg">{totalGasProduction.toLocaleString()} MCF/day</StatNumber>
              <StatHelpText>{gasFields.length} active fields</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                ${totalRevenue.toLocaleString()}
              </StatNumber>
              <StatHelpText>Daily production value</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Assets</StatLabel>
              <StatNumber fontSize="lg">{wells.length + gasFields.length}</StatNumber>
              <StatHelpText>
                {wells.length} wells, {gasFields.length} fields
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Tabbed Interface */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Oil Wells ({wells.length})</Tab>
          <Tab>Gas Fields ({gasFields.length})</Tab>
          <Tab>Extraction Sites ({extractionSites.length})</Tab>
          <Tab>Reserves & Storage</Tab>
        </TabList>

        <TabPanels>
          {/* Oil Wells Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Oil Wells Overview</Heading>
              </CardHeader>
              <CardBody>
                {wells.length === 0 ? (
                  <Text color="gray.500">No oil wells found. Create one to get started.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th isNumeric>Production (bbl/day)</Th>
                        <Th isNumeric>Depletion</Th>
                        <Th isNumeric>Revenue/Day</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {wells.map((well) => (
                        <Tr key={well._id}>
                          <Td fontWeight="medium">{well.name}</Td>
                          <Td>
                            <Badge size="sm">{well.wellType}</Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(well.status)} size="sm">
                              {well.status}
                            </Badge>
                          </Td>
                          <Td isNumeric>{well.currentProduction.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={well.depletionRate}
                                max={15}
                                size="sm"
                                colorScheme={well.depletionRate > 10 ? 'red' : 'yellow'}
                                w="60px"
                              />
                              <Text fontSize="xs">{well.depletionRate.toFixed(1)}%</Text>
                            </HStack>
                          </Td>
                          <Td isNumeric color="green.500">${well.revenue.toLocaleString()}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                onClick={() => {
                                  setSelectedWell(well);
                                  onExtractOpen();
                                }}
                                isDisabled={well.status !== 'Active'}
                              >
                                Extract
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="orange"
                                onClick={() => {
                                  setSelectedWell(well);
                                  onMaintainOpen();
                                }}
                              >
                                Maintain
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Gas Fields Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Gas Fields Overview</Heading>
              </CardHeader>
              <CardBody>
                {gasFields.length === 0 ? (
                  <Text color="gray.500">No gas fields found. Create one to get started.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Quality Grade</Th>
                        <Th isNumeric>Production (MCF/day)</Th>
                        <Th isNumeric>Pressure (psi)</Th>
                        <Th isNumeric>Depletion</Th>
                        <Th isNumeric>Revenue/Day</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {gasFields.map((field) => (
                        <Tr key={field._id}>
                          <Td fontWeight="medium">{field.name}</Td>
                          <Td>
                            <Badge colorScheme={getQualityColor(field.qualityGrade)} size="sm">
                              {field.qualityGrade}
                            </Badge>
                          </Td>
                          <Td isNumeric>{field.currentProduction.toLocaleString()}</Td>
                          <Td isNumeric>{field.pressure.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={field.depletionRate}
                                max={15}
                                size="sm"
                                colorScheme={field.depletionRate > 10 ? 'red' : 'yellow'}
                                w="60px"
                              />
                              <Text fontSize="xs">{field.depletionRate.toFixed(1)}%</Text>
                            </HStack>
                          </Td>
                          <Td isNumeric color="green.500">${field.revenue.toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Extraction Sites Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Extraction Sites Overview</Heading>
              </CardHeader>
              <CardBody>
                {extractionSites.length === 0 ? (
                  <Text color="gray.500">No extraction sites found.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Region</Th>
                        <Th isNumeric>Daily Throughput</Th>
                        <Th isNumeric>Inventory</Th>
                        <Th isNumeric>Capacity</Th>
                        <Th isNumeric>Revenue/Day</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {extractionSites.map((site) => (
                        <Tr key={site._id}>
                          <Td fontWeight="medium">{site.name}</Td>
                          <Td>{site.location.region}</Td>
                          <Td isNumeric>{site.dailyThroughput.toLocaleString()} bbl</Td>
                          <Td isNumeric>{site.currentInventory.toLocaleString()} bbl</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={(site.currentInventory / site.storageCapacity) * 100}
                                size="sm"
                                colorScheme="blue"
                                w="60px"
                              />
                              <Text fontSize="xs">
                                {((site.currentInventory / site.storageCapacity) * 100).toFixed(0)}%
                              </Text>
                            </HStack>
                          </Td>
                          <Td isNumeric color="green.500">${site.revenue.toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Reserves & Storage Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {/* Reserves */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Reserve Estimates</Heading>
                </CardHeader>
                <CardBody>
                  {reserves.length === 0 ? (
                    <Text color="gray.500">No reserve estimates available.</Text>
                  ) : (
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      {reserves.map((reserve) => (
                        <Box key={reserve._id} p={4} borderWidth={1} borderRadius="md">
                          <Badge mb={2} colorScheme={
                            reserve.classification === 'Proved' ? 'green' :
                            reserve.classification === 'Probable' ? 'blue' : 'orange'
                          }>
                            {reserve.classification}
                          </Badge>
                          <Stat>
                            <StatLabel>{reserve.commodity}</StatLabel>
                            <StatNumber fontSize="md">
                              {reserve.quantity.toLocaleString()}
                              {reserve.commodity === 'Oil' ? ' bbl' : ' MCF'}
                            </StatNumber>
                            <StatHelpText>PV-10: ${reserve.pv10Value.toLocaleString()}</StatHelpText>
                          </Stat>
                        </Box>
                      ))}
                    </Grid>
                  )}
                </CardBody>
              </Card>

              {/* Storage */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Storage Facilities</Heading>
                </CardHeader>
                <CardBody>
                  {storage.length === 0 ? (
                    <Text color="gray.500">No storage facilities found.</Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Type</Th>
                          <Th>Commodity</Th>
                          <Th isNumeric>Utilization</Th>
                          <Th isNumeric>Inventory Value</Th>
                          <Th isNumeric>Storage Cost/Month</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {storage.map((facility) => (
                          <Tr key={facility._id}>
                            <Td fontWeight="medium">{facility.name}</Td>
                            <Td>{facility.facilityType}</Td>
                            <Td>
                              <Badge size="sm">{facility.commodity}</Badge>
                            </Td>
                            <Td isNumeric>
                              <HStack spacing={2} justify="flex-end">
                                <Progress
                                  value={facility.utilizationPercent}
                                  size="sm"
                                  colorScheme={
                                    facility.utilizationPercent > 95 ? 'red' :
                                    facility.utilizationPercent > 85 ? 'yellow' : 'blue'
                                  }
                                  w="60px"
                                />
                                <Text fontSize="xs">{facility.utilizationPercent.toFixed(0)}%</Text>
                              </HStack>
                            </Td>
                            <Td isNumeric>
                              ${(facility.currentInventory * (facility.commodity === 'Oil' ? 75 : 3)).toLocaleString()}
                            </Td>
                            <Td isNumeric color="orange.500">
                              ${(facility.currentInventory * facility.storageCost).toLocaleString()}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Extraction Modal */}
      <Modal isOpen={isExtractOpen} onClose={onExtractClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Extract Oil - {selectedWell?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Current Production: {selectedWell?.currentProduction.toLocaleString()} bbl/day
              </Text>
              <Text fontSize="sm" color="gray.600">
                Oil Price: ${selectedWell?.oilPrice.toFixed(2)}/barrel
              </Text>
              <FormControl>
                <FormLabel>Extraction Duration (hours)</FormLabel>
                <NumberInput
                  value={extractionDuration}
                  onChange={(_, value) => setExtractionDuration(value)}
                  min={1}
                  max={168}
                  step={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium">Estimated Production:</Text>
                <Text>
                  {((selectedWell?.currentProduction || 0) * (extractionDuration / 24)).toLocaleString()} bbl
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium">Estimated Revenue:</Text>
                <Text color="green.500">
                  ${((selectedWell?.currentProduction || 0) * (extractionDuration / 24) * (selectedWell?.oilPrice || 0)).toLocaleString()}
                </Text>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExtractClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleExtract}
              isLoading={isOperating}
              loadingText="Extracting..."
            >
              Start Extraction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Maintenance Modal */}
      <Modal isOpen={isMaintainOpen} onClose={onMaintainClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Maintenance - {selectedWell?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Equipment Efficiency: {selectedWell?.equipment.efficiency.toFixed(1)}%
              </Text>
              <Text fontSize="sm" color="gray.600">
                Last Maintenance: {selectedWell?.lastMaintenanceDate 
                  ? new Date(selectedWell.lastMaintenanceDate).toLocaleDateString()
                  : 'Never'}
              </Text>
              <FormControl>
                <FormLabel>Maintenance Type</FormLabel>
                <Select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                >
                  <option value="Routine">Routine ($10,000, +5% efficiency)</option>
                  <option value="Major">Major ($50,000, +15% efficiency)</option>
                  <option value="Emergency">Emergency ($100,000, +25% efficiency)</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onMaintainClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleMaintenance}
              isLoading={isOperating}
              loadingText="Performing..."
            >
              Perform Maintenance
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

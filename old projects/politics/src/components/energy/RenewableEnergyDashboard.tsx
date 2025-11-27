/**
 * @file src/components/energy/RenewableEnergyDashboard.tsx
 * @description Renewable energy operations dashboard for solar, wind, and environmental compliance
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Comprehensive renewable energy management dashboard enabling Energy companies to monitor solar farms,
 * wind turbines, renewable projects, subsidies, and PPAs. Displays real-time output metrics, weather
 * impact analysis, carbon credit tracking, subsidy utilization, and environmental compliance. Integrates
 * weather-based production modeling with government incentive optimization for maximum profitability.
 * 
 * COMPONENT ARCHITECTURE:
 * - Solar farms grid: Panel efficiency, irradiance levels, degradation tracking, output forecasting
 * - Wind turbines dashboard: Blade condition, wind speed, power curve optimization, maintenance alerts
 * - Renewable projects: Portfolio aggregation, carbon offset calculations, performance analytics
 * - Subsidies management: Government incentives, disbursement tracking, compliance requirements
 * - PPA contracts: Power purchase agreements, delivery schedules, revenue guarantees
 * - Carbon credits: Emissions reductions, market value, offset calculations, trading opportunities
 * - Environmental analytics: Carbon footprint, renewable energy percentage, sustainability metrics
 * 
 * STATE MANAGEMENT:
 * - solarFarms: Array of SolarFarm documents with production data
 * - windTurbines: Array of WindTurbine documents with wind/output data
 * - renewableProjects: Array of RenewableProject documents with aggregated metrics
 * - subsidies: Government subsidy programs with disbursement status
 * - ppas: Power purchase agreements with delivery tracking
 * - carbonCredits: Carbon credit inventory with market valuations
 * - loading: Loading state during initial fetch
 * - isGenerating: Generation calculation in progress
 * - selectedAsset: Currently selected solar/wind asset for detailed view
 * 
 * API INTEGRATION:
 * - GET /api/energy/solar-farms - Fetch company's solar farms
 *   Response: { farms: SolarFarm[], totalCapacity, avgEfficiency, weatherImpact }
 * - GET /api/energy/wind-turbines - Fetch company's wind turbines
 *   Response: { turbines: WindTurbine[], totalCapacity, avgPowerFactor, windConditions }
 * - GET /api/energy/renewable-projects - Fetch renewable projects
 *   Response: { projects: RenewableProject[], totalOutput, carbonOffset, revenue }
 * - GET /api/energy/subsidies - Fetch active subsidies
 *   Response: { subsidies: Subsidy[], totalValue, utilizationRate, complianceStatus }
 * - GET /api/energy/ppas - Fetch PPA contracts
 *   Response: { ppas: PPA[], totalCommitment, deliveryStatus, revenue }
 * - POST /api/energy/solar-farms/[id]/generate - Calculate solar output
 *   Request: { hours: number }
 *   Response: { output, revenue, degradation, weatherImpact }
 * - POST /api/energy/wind-turbines/[id]/generate - Calculate wind output
 *   Request: { hours: number }
 *   Response: { output, revenue, bladeWear, windSpeed }
 * - POST /api/energy/renewable-projects/[id]/carbon - Calculate carbon credits
 *   Response: { credits, marketValue, offsetTons, certificationStatus }
 * - POST /api/energy/subsidies/[id]/disburse - Claim subsidy disbursement
 *   Response: { amount, compliance, nextDisbursement }
 * 
 * PROPS:
 * - companyId: Company ID for renewable asset lookup
 * 
 * USAGE:
 * ```tsx
 * <RenewableEnergyDashboard companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Solar output: capacity × irradiance × efficiency × (1 - degradation) × weatherFactor
 * - Wind output: 0.5 × airDensity × sweptArea × windSpeed³ × powerCoefficient × efficiency
 * - Weather impact factors:
 *   - Solar: Clear sky (1.0), Partly cloudy (0.6-0.8), Overcast (0.2-0.4), Rain/Snow (0.1-0.2)
 *   - Wind: Optimal speed 12-25 m/s (1.0), Low speed <5 m/s (0.1-0.3), High speed >30 m/s (shutdown)
 * - Panel degradation: 0.5-0.8% per year (average 0.6%)
 * - Blade degradation: 0.3-0.5% per 1000 hours operation
 * - Carbon credits: 1 credit = 1 metric ton CO2 offset
 * - Credit market value: $10-$50 per credit (varies by market/certification)
 * - Subsidy types:
 *   - PTC (Production Tax Credit): $0.015-$0.025 per kWh produced
 *   - ITC (Investment Tax Credit): 26-30% of capital costs
 *   - Grant programs: Fixed amounts for capacity installation
 *   - REC (Renewable Energy Credits): Market-based trading
 * - PPA pricing: Fixed rate or market rate + premium
 * - Capacity factor: Actual output / nameplate capacity (solar 15-25%, wind 25-45%)
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
  useToast,
  Skeleton,
  Divider,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  Tooltip,
} from '@chakra-ui/react';

/**
 * Weather condition enum
 */
type WeatherCondition = 'Clear' | 'PartlyCloudy' | 'Overcast' | 'Rain' | 'Snow' | 'Storm';

/**
 * Subsidy type enum
 */
type SubsidyType = 'PTC' | 'ITC' | 'Grant' | 'REC';

/**
 * PPA pricing type enum
 */
type PPAPricingType = 'Fixed' | 'MarketPlus';

/**
 * SolarFarm interface
 */
interface SolarFarm {
  _id: string;
  company: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  capacity: number;
  panelEfficiency: number;
  degradationRate: number;
  daysActive: number;
  currentIrradiance: number;
  weatherCondition: WeatherCondition;
  currentOutput: number;
  revenue: number;
  installationCost: number;
  operatingCost: number;
}

/**
 * WindTurbine interface
 */
interface WindTurbine {
  _id: string;
  company: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  capacity: number;
  rotorDiameter: number;
  hubHeight: number;
  currentWindSpeed: number;
  powerCoefficient: number;
  efficiency: number;
  bladeCondition: number;
  hoursOperated: number;
  currentOutput: number;
  revenue: number;
  operatingCost: number;
}

/**
 * RenewableProject interface
 */
interface RenewableProject {
  _id: string;
  company: string;
  name: string;
  projectType: 'Solar' | 'Wind' | 'Mixed';
  assets: string[];
  totalCapacity: number;
  totalOutput: number;
  carbonOffsetTons: number;
  revenue: number;
  operatingCost: number;
}

/**
 * Subsidy interface
 */
interface Subsidy {
  _id: string;
  company: string;
  subsidyType: SubsidyType;
  provider: string;
  amount: number;
  remainingAmount: number;
  startDate: Date;
  endDate: Date;
  complianceStatus: 'Compliant' | 'Warning' | 'NonCompliant';
  nextDisbursement?: Date;
}

/**
 * PPA interface
 */
interface PPA {
  _id: string;
  company: string;
  buyer: string;
  pricingType: PPAPricingType;
  pricePerKWh: number;
  committedCapacity: number;
  deliveredThisPeriod: number;
  revenue: number;
  startDate: Date;
  endDate: Date;
  deliveryStatus: 'OnTrack' | 'Behind' | 'Ahead';
}

/**
 * CarbonCredit interface
 */
interface CarbonCredit {
  credits: number;
  marketValue: number;
  offsetTons: number;
  certificationStatus: string;
}

/**
 * RenewableEnergyDashboard component props
 */
interface RenewableEnergyDashboardProps {
  companyId: string;
}

/**
 * RenewableEnergyDashboard component
 * 
 * @description
 * Renewable energy operations dashboard for solar, wind, carbon credits, subsidies, and PPAs
 * with weather-based production modeling and environmental compliance tracking
 * 
 * @param {RenewableEnergyDashboardProps} props - Component props
 * @returns {JSX.Element} RenewableEnergyDashboard component
 */
export default function RenewableEnergyDashboard({
  companyId,
}: RenewableEnergyDashboardProps): JSX.Element {
  const toast = useToast();
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const { isOpen: isCarbonOpen, onOpen: onCarbonOpen, onClose: onCarbonClose } = useDisclosure();

  // State management
  const [solarFarms, setSolarFarms] = useState<SolarFarm[]>([]);
  const [windTurbines, setWindTurbines] = useState<WindTurbine[]>([]);
  const [renewableProjects, setRenewableProjects] = useState<RenewableProject[]>([]);
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [ppas, setPPAs] = useState<PPA[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedSolar, setSelectedSolar] = useState<SolarFarm | null>(null);
  const [selectedWind, setSelectedWind] = useState<WindTurbine | null>(null);
  const [selectedProject, setSelectedProject] = useState<RenewableProject | null>(null);
  const [generationHours, setGenerationHours] = useState<number>(24);
  const [carbonCredits, setCarbonCredits] = useState<CarbonCredit | null>(null);

  /**
   * Fetch all renewable energy data
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [solarRes, windRes, projectsRes, subsidiesRes, ppasRes] = await Promise.all([
        fetch(`/api/energy/solar-farms?company=${companyId}`),
        fetch(`/api/energy/wind-turbines?company=${companyId}`),
        fetch(`/api/energy/renewable-projects?company=${companyId}`),
        fetch(`/api/energy/subsidies?company=${companyId}`),
        fetch(`/api/energy/ppas?company=${companyId}`),
      ]);

      const [solarData, windData, projectsData, subsidiesData, ppasData] = await Promise.all([
        solarRes.json(),
        windRes.json(),
        projectsRes.json(),
        subsidiesRes.json(),
        ppasRes.json(),
      ]);

      setSolarFarms(solarData.farms || []);
      setWindTurbines(windData.turbines || []);
      setRenewableProjects(projectsData.projects || []);
      setSubsidies(subsidiesData.subsidies || []);
      setPPAs(ppasData.ppas || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to fetch renewable energy data',
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
   * Handle generation operation (solar or wind)
   */
  const handleGenerate = async () => {
    if (!selectedSolar && !selectedWind) return;

    setIsGenerating(true);
    try {
      const endpoint = selectedSolar
        ? `/api/energy/solar-farms/${selectedSolar._id}/generate`
        : `/api/energy/wind-turbines/${selectedWind!._id}/generate`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: generationHours }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Generation complete',
          description: `Output: ${data.output?.toLocaleString()} kWh, Revenue: $${data.revenue?.toLocaleString()}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Refresh data
        fetchData();
        onGenerateClose();
      } else {
        toast({
          title: 'Generation failed',
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
      setIsGenerating(false);
    }
  };

  /**
   * Handle carbon credit calculation
   */
  const handleCarbonCalculation = async () => {
    if (!selectedProject) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/energy/renewable-projects/${selectedProject._id}/carbon`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setCarbonCredits(data);
        toast({
          title: 'Carbon credits calculated',
          description: `${data.credits} credits worth $${data.marketValue?.toLocaleString()}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Calculation failed',
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
      setIsGenerating(false);
    }
  };

  /**
   * Calculate total capacity and output
   */
  const totalSolarCapacity = solarFarms.reduce((sum, farm) => sum + farm.capacity, 0);
  const totalWindCapacity = windTurbines.reduce((sum, turbine) => sum + turbine.capacity, 0);
  const totalSolarOutput = solarFarms.reduce((sum, farm) => sum + farm.currentOutput, 0);
  const totalWindOutput = windTurbines.reduce((sum, turbine) => sum + turbine.currentOutput, 0);
  const totalRevenue = solarFarms.reduce((sum, farm) => sum + farm.revenue, 0) +
    windTurbines.reduce((sum, turbine) => sum + turbine.revenue, 0);
  const totalCarbonOffset = renewableProjects.reduce((sum, project) => sum + project.carbonOffsetTons, 0);

  /**
   * Get weather badge color
   */
  const getWeatherColor = (weather: WeatherCondition): string => {
    switch (weather) {
      case 'Clear': return 'green';
      case 'PartlyCloudy': return 'blue';
      case 'Overcast': return 'gray';
      case 'Rain': case 'Snow': return 'purple';
      case 'Storm': return 'red';
      default: return 'gray';
    }
  };

  /**
   * Get compliance badge color
   */
  const getComplianceColor = (status: string): string => {
    switch (status) {
      case 'Compliant': return 'green';
      case 'Warning': return 'yellow';
      case 'NonCompliant': return 'red';
      default: return 'gray';
    }
  };

  /**
   * Get delivery status color
   */
  const getDeliveryColor = (status: string): string => {
    switch (status) {
      case 'OnTrack': return 'green';
      case 'Behind': return 'red';
      case 'Ahead': return 'blue';
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
              <StatLabel>Total Capacity</StatLabel>
              <StatNumber fontSize="lg">
                {(totalSolarCapacity + totalWindCapacity).toLocaleString()} MW
              </StatNumber>
              <StatHelpText>
                {totalSolarCapacity.toLocaleString()} MW solar, {totalWindCapacity.toLocaleString()} MW wind
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Current Output</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                {(totalSolarOutput + totalWindOutput).toLocaleString()} kWh
              </StatNumber>
              <StatHelpText>
                {((totalSolarOutput + totalWindOutput) / (totalSolarCapacity + totalWindCapacity) * 100).toFixed(1)}% capacity factor
              </StatHelpText>
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
              <StatHelpText>From renewable generation</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Carbon Offset</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                {totalCarbonOffset.toLocaleString()} tons
              </StatNumber>
              <StatHelpText>CO₂ emissions reduced</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Tabbed Interface */}
      <Tabs variant="enclosed" colorScheme="green">
        <TabList>
          <Tab>Solar Farms ({solarFarms.length})</Tab>
          <Tab>Wind Turbines ({windTurbines.length})</Tab>
          <Tab>Projects ({renewableProjects.length})</Tab>
          <Tab>Subsidies ({subsidies.length})</Tab>
          <Tab>PPAs ({ppas.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Solar Farms Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Solar Farms Overview</Heading>
              </CardHeader>
              <CardBody>
                {solarFarms.length === 0 ? (
                  <Text color="gray.500">No solar farms found. Create one to get started.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Weather</Th>
                        <Th isNumeric>Capacity (MW)</Th>
                        <Th isNumeric>Efficiency</Th>
                        <Th isNumeric>Output (kWh)</Th>
                        <Th isNumeric>Revenue/Day</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {solarFarms.map((farm) => (
                        <Tr key={farm._id}>
                          <Td fontWeight="medium">{farm.name}</Td>
                          <Td>
                            <Badge colorScheme={getWeatherColor(farm.weatherCondition)} size="sm">
                              {farm.weatherCondition}
                            </Badge>
                          </Td>
                          <Td isNumeric>{farm.capacity.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={farm.panelEfficiency}
                                max={25}
                                size="sm"
                                colorScheme={farm.panelEfficiency > 20 ? 'green' : 'yellow'}
                                w="60px"
                              />
                              <Text fontSize="xs">{farm.panelEfficiency.toFixed(1)}%</Text>
                            </HStack>
                          </Td>
                          <Td isNumeric>{farm.currentOutput.toLocaleString()}</Td>
                          <Td isNumeric color="green.500">${farm.revenue.toLocaleString()}</Td>
                          <Td>
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => {
                                setSelectedSolar(farm);
                                setSelectedWind(null);
                                onGenerateOpen();
                              }}
                            >
                              Generate
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Wind Turbines Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Wind Turbines Overview</Heading>
              </CardHeader>
              <CardBody>
                {windTurbines.length === 0 ? (
                  <Text color="gray.500">No wind turbines found. Create one to get started.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th isNumeric>Wind Speed (m/s)</Th>
                        <Th isNumeric>Capacity (MW)</Th>
                        <Th isNumeric>Blade Condition</Th>
                        <Th isNumeric>Output (kWh)</Th>
                        <Th isNumeric>Revenue/Day</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {windTurbines.map((turbine) => (
                        <Tr key={turbine._id}>
                          <Td fontWeight="medium">{turbine.name}</Td>
                          <Td isNumeric>
                            <Tooltip label={
                              turbine.currentWindSpeed < 5 ? 'Low wind' :
                              turbine.currentWindSpeed > 30 ? 'Shutdown risk' :
                              turbine.currentWindSpeed >= 12 && turbine.currentWindSpeed <= 25 ? 'Optimal' : 'Normal'
                            }>
                              <Badge colorScheme={
                                turbine.currentWindSpeed < 5 ? 'red' :
                                turbine.currentWindSpeed > 30 ? 'red' :
                                turbine.currentWindSpeed >= 12 && turbine.currentWindSpeed <= 25 ? 'green' : 'blue'
                              } size="sm">
                                {turbine.currentWindSpeed.toFixed(1)}
                              </Badge>
                            </Tooltip>
                          </Td>
                          <Td isNumeric>{turbine.capacity.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={turbine.bladeCondition}
                                max={100}
                                size="sm"
                                colorScheme={turbine.bladeCondition > 80 ? 'green' : turbine.bladeCondition > 60 ? 'yellow' : 'red'}
                                w="60px"
                              />
                              <Text fontSize="xs">{turbine.bladeCondition.toFixed(0)}%</Text>
                            </HStack>
                          </Td>
                          <Td isNumeric>{turbine.currentOutput.toLocaleString()}</Td>
                          <Td isNumeric color="green.500">${turbine.revenue.toLocaleString()}</Td>
                          <Td>
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => {
                                setSelectedWind(turbine);
                                setSelectedSolar(null);
                                onGenerateOpen();
                              }}
                            >
                              Generate
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Renewable Projects Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Renewable Projects Overview</Heading>
              </CardHeader>
              <CardBody>
                {renewableProjects.length === 0 ? (
                  <Text color="gray.500">No renewable projects found.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Type</Th>
                        <Th isNumeric>Capacity (MW)</Th>
                        <Th isNumeric>Output (kWh)</Th>
                        <Th isNumeric>Carbon Offset (tons)</Th>
                        <Th isNumeric>Revenue/Day</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {renewableProjects.map((project) => (
                        <Tr key={project._id}>
                          <Td fontWeight="medium">{project.name}</Td>
                          <Td>
                            <Badge size="sm" colorScheme={
                              project.projectType === 'Solar' ? 'yellow' :
                              project.projectType === 'Wind' ? 'blue' : 'green'
                            }>
                              {project.projectType}
                            </Badge>
                          </Td>
                          <Td isNumeric>{project.totalCapacity.toLocaleString()}</Td>
                          <Td isNumeric>{project.totalOutput.toLocaleString()}</Td>
                          <Td isNumeric color="green.500">{project.carbonOffsetTons.toLocaleString()}</Td>
                          <Td isNumeric color="green.500">${project.revenue.toLocaleString()}</Td>
                          <Td>
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => {
                                setSelectedProject(project);
                                handleCarbonCalculation();
                                onCarbonOpen();
                              }}
                            >
                              Carbon Credits
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Subsidies Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Government Subsidies</Heading>
              </CardHeader>
              <CardBody>
                {subsidies.length === 0 ? (
                  <Text color="gray.500">No active subsidies found.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Type</Th>
                        <Th>Provider</Th>
                        <Th isNumeric>Total Amount</Th>
                        <Th isNumeric>Remaining</Th>
                        <Th>Compliance</Th>
                        <Th>Next Disbursement</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {subsidies.map((subsidy) => (
                        <Tr key={subsidy._id}>
                          <Td>
                            <Badge size="sm" colorScheme="purple">{subsidy.subsidyType}</Badge>
                          </Td>
                          <Td>{subsidy.provider}</Td>
                          <Td isNumeric>${subsidy.amount.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={(subsidy.remainingAmount / subsidy.amount) * 100}
                                size="sm"
                                colorScheme="blue"
                                w="60px"
                              />
                              <Text fontSize="xs">${subsidy.remainingAmount.toLocaleString()}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={getComplianceColor(subsidy.complianceStatus)} size="sm">
                              {subsidy.complianceStatus}
                            </Badge>
                          </Td>
                          <Td>
                            {subsidy.nextDisbursement
                              ? new Date(subsidy.nextDisbursement).toLocaleDateString()
                              : 'N/A'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* PPAs Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Power Purchase Agreements</Heading>
              </CardHeader>
              <CardBody>
                {ppas.length === 0 ? (
                  <Text color="gray.500">No active PPAs found.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Buyer</Th>
                        <Th>Pricing</Th>
                        <Th isNumeric>Price/kWh</Th>
                        <Th isNumeric>Committed (MW)</Th>
                        <Th isNumeric>Delivered</Th>
                        <Th>Status</Th>
                        <Th isNumeric>Revenue</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {ppas.map((ppa) => (
                        <Tr key={ppa._id}>
                          <Td fontWeight="medium">{ppa.buyer}</Td>
                          <Td>
                            <Badge size="sm">{ppa.pricingType}</Badge>
                          </Td>
                          <Td isNumeric>${ppa.pricePerKWh.toFixed(3)}</Td>
                          <Td isNumeric>{ppa.committedCapacity.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={(ppa.deliveredThisPeriod / ppa.committedCapacity) * 100}
                                size="sm"
                                colorScheme={
                                  ppa.deliveryStatus === 'OnTrack' ? 'green' :
                                  ppa.deliveryStatus === 'Behind' ? 'red' : 'blue'
                                }
                                w="60px"
                              />
                              <Text fontSize="xs">
                                {((ppa.deliveredThisPeriod / ppa.committedCapacity) * 100).toFixed(0)}%
                              </Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={getDeliveryColor(ppa.deliveryStatus)} size="sm">
                              {ppa.deliveryStatus}
                            </Badge>
                          </Td>
                          <Td isNumeric color="green.500">${ppa.revenue.toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Generation Modal */}
      <Modal isOpen={isGenerateOpen} onClose={onGenerateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Generate Power - {selectedSolar?.name || selectedWind?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedSolar && (
                <>
                  <Text fontSize="sm" color="gray.600">
                    Weather: {selectedSolar.weatherCondition}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Panel Efficiency: {selectedSolar.panelEfficiency.toFixed(1)}%
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Current Irradiance: {selectedSolar.currentIrradiance.toFixed(0)} W/m²
                  </Text>
                </>
              )}
              {selectedWind && (
                <>
                  <Text fontSize="sm" color="gray.600">
                    Wind Speed: {selectedWind.currentWindSpeed.toFixed(1)} m/s
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Blade Condition: {selectedWind.bladeCondition.toFixed(0)}%
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Power Coefficient: {selectedWind.powerCoefficient.toFixed(2)}
                  </Text>
                </>
              )}
              <FormControl>
                <FormLabel>Generation Duration (hours)</FormLabel>
                <NumberInput
                  value={generationHours}
                  onChange={(_, value) => setGenerationHours(value)}
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
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onGenerateClose}>
              Cancel
            </Button>
            <Button
              colorScheme={selectedSolar ? 'yellow' : 'blue'}
              onClick={handleGenerate}
              isLoading={isGenerating}
              loadingText="Generating..."
            >
              Calculate Output
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Carbon Credits Modal */}
      <Modal isOpen={isCarbonOpen} onClose={onCarbonClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Carbon Credits - {selectedProject?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {carbonCredits ? (
              <VStack spacing={4} align="stretch">
                <Stat>
                  <StatLabel>Carbon Credits Earned</StatLabel>
                  <StatNumber color="green.500">{carbonCredits.credits.toLocaleString()}</StatNumber>
                  <StatHelpText>1 credit = 1 ton CO₂ offset</StatHelpText>
                </Stat>
                <Divider />
                <HStack justify="space-between">
                  <Text fontWeight="medium">Market Value:</Text>
                  <Text color="green.500" fontSize="lg">
                    ${carbonCredits.marketValue.toLocaleString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="medium">CO₂ Offset:</Text>
                  <Text>{carbonCredits.offsetTons.toLocaleString()} tons</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="medium">Certification:</Text>
                  <Badge colorScheme="green">{carbonCredits.certificationStatus}</Badge>
                </HStack>
              </VStack>
            ) : (
              <Text>Loading carbon credit data...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={onCarbonClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

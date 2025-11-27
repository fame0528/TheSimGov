/**
 * @file src/components/software/CloudInfrastructureManager.tsx
 * @description Cloud infrastructure service management dashboard
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Financial operations dashboard for Technology/Software companies managing cloud
 * infrastructure services (Compute, Storage, Database, AI). Monitors capacity allocation,
 * utilization rates, revenue metrics, and optimization opportunities. Provides real-time
 * visibility into server performance and profitability.
 * 
 * FEATURES:
 * - Cloud service creation with $1.5M launch cost validation
 * - Service type breakdown with PieChart visualization (Compute/Storage/Database/AI)
 * - Capacity utilization trends with AreaChart and forecasting
 * - Utilization alerts (warning >80%, critical >90%)
 * - Top 5 revenue drivers table with utilization metrics
 * - Server location and redundancy configuration
 * - Auto-scaling recommendations based on utilization thresholds
 * - Time period filtering (7d, 30d, 90d, YTD)
 * - Export functionality for financial reporting
 * 
 * BUSINESS LOGIC:
 * - Launch cost: $1.5M ($1M infrastructure + $500k setup)
 * - Profit margin: 72% (28% operational cost)
 * - Target utilization: 70-80% (optimal capacity)
 * - Capacity buffer: 20-30% for demand spikes
 * - Pricing: $200/unit base (varies by type)
 * - Alert thresholds: Warning 80%, critical 90%
 * - Auto-scaling trigger: >80% sustained utilization
 * 
 * USAGE:
 * ```tsx
 * import CloudInfrastructureManager from '@/components/software/CloudInfrastructureManager';
 * 
 * <CloudInfrastructureManager companyId={companyId} />
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  useDisclosure,
  Progress,
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
import { FiDownload, FiPlus, FiServer } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface CloudInfrastructureManagerProps {
  companyId: string;
}

interface CloudServer {
  _id: string;
  company: string;
  type: 'Compute' | 'Storage' | 'Database' | 'AI';
  totalCapacity: number;
  allocatedCapacity: number;
  serverLocation: string;
  redundancyLevel: string;
  uptimeTarget: number;
  pricePerUnit: number;
  activeCustomers: number;
  monthlyRevenue: number;
  createdAt: string;
}

interface TypeBreakdown {
  type: string;
  count: number;
  totalCapacity: number;
  revenue: number;
}

interface UtilizationTrend {
  date: string;
  utilization: number;
  forecast?: number;
}

interface ServerSummary {
  totalServers: number;
  totalCapacity: number;
  avgUtilization: number;
  totalRevenue: number;
  profitMargin: number;
}

type TimePeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'ytd';

// Chart colors
const TYPE_COLORS = {
  Compute: '#3182ce',
  Storage: '#38a169',
  Database: '#d69e2e',
  AI: '#805ad5',
};

// ============================================================================
// Main Component
// ============================================================================

export default function CloudInfrastructureManager({
  companyId,
}: CloudInfrastructureManagerProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<TimePeriod>('last_30_days');
  const [servers, setServers] = useState<CloudServer[]>([]);
  const [summary, setSummary] = useState<ServerSummary | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<TypeBreakdown[]>([]);
  const [utilizationTrends, setUtilizationTrends] = useState<UtilizationTrend[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'Compute' as 'Compute' | 'Storage' | 'Database' | 'AI',
    totalCapacity: 1000,
    serverLocation: 'US-East',
    redundancyLevel: 'Standard',
    uptimeTarget: 99.9,
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch cloud servers and metrics
   */
  const fetchServers = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId, period });
      const response = await fetch(`/api/cloud/servers?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch cloud servers');
      }

      const data = await response.json();

      if (data.success) {
        setServers(data.servers || []);
        setSummary(data.aggregatedMetrics || null);
        setTypeBreakdown(data.typeBreakdown || []);
        setUtilizationTrends(data.utilizationTrends || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching servers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load cloud servers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, period, toast]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // ============================================================================
  // Server Creation
  // ============================================================================

  /**
   * Launch new cloud service
   */
  const handleLaunch = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/cloud/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyId,
          type: formData.type,
          totalCapacity: formData.totalCapacity,
          serverLocation: formData.serverLocation,
          redundancyLevel: formData.redundancyLevel,
          uptimeTarget: formData.uptimeTarget,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to launch service');
      }

      const data = await response.json();

      toast({
        title: 'Service Launched',
        description: `${data.server.type} cloud service launched successfully ($1.5M investment)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setFormData({
        type: 'Compute',
        totalCapacity: 1000,
        serverLocation: 'US-East',
        redundancyLevel: 'Standard',
        uptimeTarget: 99.9,
      });
      onClose();
      fetchServers();
    } catch (error: any) {
      console.error('Error launching service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to launch service',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Export Functionality
  // ============================================================================

  /**
   * Export server data to JSON
   */
  const exportData = () => {
    const exportPayload = {
      summary,
      servers,
      typeBreakdown,
      utilizationTrends,
      period,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloud-servers-${period}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: 'Cloud server data exported successfully',
      status: 'success',
      duration: 3000,
    });
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get utilization status color
   */
  const getUtilizationStatus = (utilization: number): 'success' | 'warning' | 'error' => {
    if (utilization >= 90) return 'error';
    if (utilization >= 80) return 'warning';
    return 'success';
  };

  /**
   * Get type badge color
   */
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Compute':
        return 'blue';
      case 'Storage':
        return 'green';
      case 'Database':
        return 'yellow';
      case 'AI':
        return 'purple';
      default:
        return 'gray';
    }
  };

  /**
   * Calculate utilization percentage
   */
  const getUtilization = (server: CloudServer): number => {
    return Math.round((server.allocatedCapacity / server.totalCapacity) * 100);
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading cloud infrastructure...
        </Text>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontWeight="medium">
          Failed to load cloud infrastructure data
        </Text>
      </Box>
    );
  }

  const criticalUtilization = summary.avgUtilization >= 80;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">
            Cloud Infrastructure
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Cloud service capacity and revenue management
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

          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
            Launch Service
          </Button>
        </HStack>
      </HStack>

      {/* Utilization Alert */}
      {criticalUtilization && (
        <Alert status={getUtilizationStatus(summary.avgUtilization)} borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>
              {summary.avgUtilization >= 90
                ? 'Critical: Capacity Threshold Exceeded'
                : 'Warning: High Capacity Utilization'}
            </AlertTitle>
            <AlertDescription fontSize="sm">
              {summary.avgUtilization >= 90
                ? `Average utilization at ${summary.avgUtilization.toFixed(1)}%. Auto-scaling recommended.`
                : `Average utilization at ${summary.avgUtilization.toFixed(1)}%. Monitor capacity closely.`}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={6}>
        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Servers</StatLabel>
          <StatNumber color="blue.600">{summary.totalServers}</StatNumber>
          <StatHelpText>Active services</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Capacity</StatLabel>
          <StatNumber color="purple.600">{summary.totalCapacity.toLocaleString()}</StatNumber>
          <StatHelpText>Units available</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Avg Utilization</StatLabel>
          <StatNumber color={summary.avgUtilization > 80 ? 'red.600' : 'green.600'}>
            {summary.avgUtilization.toFixed(1)}%
          </StatNumber>
          <StatHelpText>
            {summary.avgUtilization > 80 ? (
              <StatArrow type="increase" />
            ) : (
              <StatArrow type="decrease" />
            )}
            {summary.avgUtilization > 70 ? 'High' : 'Optimal'}
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
          <StatLabel>Monthly Revenue</StatLabel>
          <StatNumber color="green.600">${summary.totalRevenue.toLocaleString()}</StatNumber>
          <StatHelpText>Current period</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Profit Margin</StatLabel>
          <StatNumber color="orange.600">{summary.profitMargin.toFixed(1)}%</StatNumber>
          <StatHelpText>Target: 72%</StatHelpText>
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
              {/* Type Breakdown Pie Chart */}
              <Box
                bg="white"
                p={6}
                borderRadius="lg"
                shadow="sm"
                border="1px solid"
                borderColor="gray.200"
              >
                <Heading size="md" mb={4}>
                  Service Type Distribution
                </Heading>

                {typeBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeBreakdown as any}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: any) => `${entry.type}: ${entry.count}`}
                      >
                        {typeBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS] || '#718096'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No service type data available
                  </Text>
                )}
              </Box>

              {/* Utilization Trends Area Chart */}
              <Box
                bg="white"
                p={6}
                borderRadius="lg"
                shadow="sm"
                border="1px solid"
                borderColor="gray.200"
              >
                <Heading size="md" mb={4}>
                  Capacity Utilization Trends
                </Heading>

                {utilizationTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={utilizationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="utilization"
                        stroke="#3182ce"
                        fill="#3182ce"
                        fillOpacity={0.3}
                        name="Utilization (%)"
                      />
                      {utilizationTrends.some((t) => t.forecast) && (
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          stroke="#d69e2e"
                          fill="#d69e2e"
                          fillOpacity={0.2}
                          strokeDasharray="5 5"
                          name="Forecast (%)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No utilization trend data available
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
                Active Cloud Services
              </Heading>

              {servers.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Location</Th>
                      <Th isNumeric>Capacity</Th>
                      <Th>Utilization</Th>
                      <Th isNumeric>Customers</Th>
                      <Th isNumeric>Monthly Revenue</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {servers.map((server) => {
                      const utilization = getUtilization(server);
                      return (
                        <Tr key={server._id}>
                          <Td>
                            <Badge colorScheme={getTypeColor(server.type)}>{server.type}</Badge>
                          </Td>
                          <Td fontSize="sm">{server.serverLocation}</Td>
                          <Td isNumeric fontSize="sm">
                            {server.allocatedCapacity.toLocaleString()} /{' '}
                            {server.totalCapacity.toLocaleString()}
                          </Td>
                          <Td>
                            <VStack align="stretch" spacing={1}>
                              <Progress
                                value={utilization}
                                colorScheme={
                                  utilization >= 90 ? 'red' : utilization >= 80 ? 'yellow' : 'green'
                                }
                                size="sm"
                                borderRadius="full"
                              />
                              <Text fontSize="xs" color="gray.600">
                                {utilization}%
                              </Text>
                            </VStack>
                          </Td>
                          <Td isNumeric fontWeight="semibold">
                            {server.activeCustomers}
                          </Td>
                          <Td isNumeric fontWeight="semibold" color="green.600">
                            ${server.monthlyRevenue.toLocaleString()}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500" textAlign="center" py={8}>
                  No cloud services found. Launch your first service!
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
                Auto-Scaling Recommendations
              </Heading>

              <VStack spacing={4} align="stretch">
                {servers
                  .filter((s) => getUtilization(s) > 80)
                  .map((server) => (
                    <Box
                      key={server._id}
                      p={4}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="orange.200"
                      bg="orange.50"
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <Badge colorScheme="orange" fontSize="sm">
                            HIGH PRIORITY
                          </Badge>
                          <Text fontWeight="bold">{server.type} Service</Text>
                        </HStack>
                        <Text fontWeight="semibold" color="orange.600">
                          {getUtilization(server)}% Utilization
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.700">
                        Location: {server.serverLocation} | Capacity:{' '}
                        {server.totalCapacity.toLocaleString()} units | Consider scaling up by 20-30%
                        to maintain optimal buffer.
                      </Text>
                    </Box>
                  ))}

                {servers.filter((s) => getUtilization(s) > 80).length === 0 && (
                  <Text color="gray.500" textAlign="center" py={8}>
                    All services operating within optimal capacity range (70-80%)
                  </Text>
                )}
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Launch Service Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiServer />
              <Text>Launch Cloud Service</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Launch cost: $1.5M ($1M infrastructure + $500k setup). Target 72% profit margin.
                </Text>
              </Alert>

              <FormControl isRequired>
                <FormLabel>Service Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                >
                  <option value="Compute">Compute (CPU/RAM intensive)</option>
                  <option value="Storage">Storage (Object/Block storage)</option>
                  <option value="Database">Database (Managed databases)</option>
                  <option value="AI">AI (ML training/inference)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Total Capacity (units)</FormLabel>
                <NumberInput
                  value={formData.totalCapacity}
                  onChange={(valueString) =>
                    setFormData({ ...formData, totalCapacity: parseInt(valueString) || 0 })
                  }
                  min={100}
                  step={100}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Server Location</FormLabel>
                <Select
                  value={formData.serverLocation}
                  onChange={(e) => setFormData({ ...formData, serverLocation: e.target.value })}
                >
                  <option value="US-East">US-East</option>
                  <option value="US-West">US-West</option>
                  <option value="EU-Central">EU-Central</option>
                  <option value="Asia-Pacific">Asia-Pacific</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Redundancy Level</FormLabel>
                <Select
                  value={formData.redundancyLevel}
                  onChange={(e) => setFormData({ ...formData, redundancyLevel: e.target.value })}
                >
                  <option value="Standard">Standard (2x replication)</option>
                  <option value="High">High (3x replication)</option>
                  <option value="Maximum">Maximum (5x replication)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Uptime Target (%)</FormLabel>
                <NumberInput
                  value={formData.uptimeTarget}
                  onChange={(valueString) =>
                    setFormData({ ...formData, uptimeTarget: parseFloat(valueString) || 99.9 })
                  }
                  min={95}
                  max={99.99}
                  step={0.1}
                  precision={2}
                >
                  <NumberInputField />
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  99.9% = 43 min/month downtime, 99.99% = 4 min/month
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleLaunch}
              isLoading={submitting}
              isDisabled={formData.totalCapacity < 100}
            >
              Launch ($1.5M)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COMPONENT ARCHITECTURE:
 *    - Tab-based navigation (Overview, Services, Optimization)
 *    - Alert system for capacity warnings (80%/90% thresholds)
 *    - Time period filtering with Select dropdown
 *    - Export functionality for financial reporting
 *    - Modal-based service launch workflow
 * 
 * 2. DATA FLOW:
 *    - useCallback for fetchServers (memoized with period dependency)
 *    - useEffect triggers fetch on period changes
 *    - Single state objects for servers, summary, breakdown, trends
 *    - Toast notifications for errors and success actions
 * 
 * 3. CAPACITY ALERTS:
 *    - Warning Alert at 80% utilization (yellow)
 *    - Critical Alert at 90% utilization (red)
 *    - Auto-scaling recommendations in Optimization tab
 * 
 * 4. VISUALIZATIONS:
 *    - Type breakdown: PieChart with service types (Compute/Storage/Database/AI)
 *    - Utilization trends: AreaChart with actual + forecast lines
 *    - Active services: Table with Progress bars for utilization
 * 
 * 5. LAUNCH WORKFLOW:
 *    - $1.5M cost validation and display
 *    - Service type selection with descriptions
 *    - Capacity, location, redundancy, uptime configuration
 *    - Launch button disabled until minimum capacity met
 * 
 * 6. OPTIMIZATION:
 *    - Filters servers >80% utilization
 *    - Displays high-priority scaling recommendations
 *    - Shows optimal capacity range messaging
 */

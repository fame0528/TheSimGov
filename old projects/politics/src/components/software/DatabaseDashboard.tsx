/**
 * @file src/components/software/DatabaseDashboard.tsx
 * @description Managed database instance tracking and resource monitoring
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Dashboard for Technology/Software companies managing per-customer database instances
 * across cloud infrastructure. Tracks resource allocation (vCPU, storage), utilization
 * rates, tier-based billing, and auto-scaling recommendations. Provides visibility into
 * database performance, customer usage patterns, and revenue optimization.
 * 
 * FEATURES:
 * - Database instance creation with tier-based defaults (Startup/Enterprise/Government)
 * - Resource allocation tracking (vCPU, storage GB)
 * - Tier distribution breakdown with BarChart visualization
 * - Resource utilization trends with AreaChart and forecasting
 * - Database type filtering (SQL, NoSQL, Graph, TimeSeries)
 * - Auto-scaling status indicators and recommendations
 * - Volume discount calculations (10% >$1k, 20% >$10k)
 * - Monthly billing summary with prorated calculations
 * - Customer filtering and search
 * 
 * BUSINESS LOGIC:
 * - Base pricing: $200 + (vCPU × $20) + (storage GB × $0.50)
 * - Tier defaults: Startup (2 vCPU, 50GB), Enterprise (8/500), Government (32/2000)
 * - Volume discounts: 10% discount if bill >$1k, 20% if >$10k
 * - Auto-scaling trigger: >80% vCPU or storage utilization
 * - Replication factor: Standard (2x), High (3x), Maximum (5x)
 * - Utilization tracking: Real-time vCPU and storage metrics
 * 
 * USAGE:
 * ```tsx
 * import DatabaseDashboard from '@/components/software/DatabaseDashboard';
 * 
 * <DatabaseDashboard companyId={companyId} cloudServerId={serverId} />
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
  Select,
  Input,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  useDisclosure,
  Progress,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiPlus, FiDatabase } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface DatabaseDashboardProps {
  companyId: string;
  cloudServerId?: string;
  customerId?: string;
}

interface DatabaseInstance {
  _id: string;
  cloudServer: string;
  customer: string;
  customerName?: string;
  tier: 'Startup' | 'Enterprise' | 'Government';
  databaseType: 'SQL' | 'NoSQL' | 'Graph' | 'TimeSeries';
  allocatedVCpu: number;
  allocatedStorage: number;
  vCpuUtilization: number;
  storageUtilization: number;
  replicationFactor: number;
  autoScalingEnabled: boolean;
  monthlyBill: number;
  paymentStatus: string;
  createdAt: string;
}

interface TierDistribution {
  tier: string;
  count: number;
  totalRevenue: number;
}

interface UtilizationTrend {
  date: string;
  vCpu: number;
  storage: number;
}

interface DatabaseSummary {
  totalInstances: number;
  totalVCpu: number;
  totalStorage: number;
  avgVCpuUtilization: number;
  avgStorageUtilization: number;
  totalMonthlyRevenue: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function DatabaseDashboard({
  companyId,
  cloudServerId,
  customerId,
}: DatabaseDashboardProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
  const [summary, setSummary] = useState<DatabaseSummary | null>(null);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
  const [utilizationTrends, setUtilizationTrends] = useState<UtilizationTrend[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    tier: 'Enterprise' as 'Startup' | 'Enterprise' | 'Government',
    databaseType: 'SQL' as 'SQL' | 'NoSQL' | 'Graph' | 'TimeSeries',
    customerId: customerId || '',
    autoScalingEnabled: true,
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch database instances and metrics
   */
  const fetchDatabases = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId });
      if (cloudServerId) params.append('cloudServerId', cloudServerId);
      if (customerId) params.append('customerId', customerId);
      if (tierFilter) params.append('tier', tierFilter);
      if (typeFilter) params.append('databaseType', typeFilter);

      const response = await fetch(`/api/cloud/databases?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }

      const data = await response.json();

      if (data.success) {
        setDatabases(data.databases || []);
        setSummary(data.aggregatedMetrics || null);
        setTierDistribution(data.tierDistribution || []);
        setUtilizationTrends(data.utilizationTrends || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching databases:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load databases',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, cloudServerId, customerId, tierFilter, typeFilter, toast]);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  // ============================================================================
  // Database Creation
  // ============================================================================

  /**
   * Create new database instance
   */
  const handleCreate = async () => {
    if (!formData.customerId) {
      toast({
        title: 'Validation Error',
        description: 'Customer ID is required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/cloud/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudServer: cloudServerId || '',
          customer: formData.customerId,
          tier: formData.tier,
          databaseType: formData.databaseType,
          autoScalingEnabled: formData.autoScalingEnabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create database');
      }

      const data = await response.json();

      toast({
        title: 'Database Created',
        description: `${data.database.tier} ${data.database.databaseType} instance created successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setFormData({
        tier: 'Enterprise',
        databaseType: 'SQL',
        customerId: customerId || '',
        autoScalingEnabled: true,
      });
      onClose();
      fetchDatabases();
    } catch (error: any) {
      console.error('Error creating database:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create database',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get tier badge color
   */
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'Startup':
        return 'blue';
      case 'Enterprise':
        return 'green';
      case 'Government':
        return 'purple';
      default:
        return 'gray';
    }
  };

  /**
   * Get database type badge color
   */
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'SQL':
        return 'blue';
      case 'NoSQL':
        return 'green';
      case 'Graph':
        return 'purple';
      case 'TimeSeries':
        return 'orange';
      default:
        return 'gray';
    }
  };

  /**
   * Get utilization status
   */
  const getUtilizationStatus = (utilization: number): string => {
    if (utilization >= 80) return 'red';
    if (utilization >= 60) return 'yellow';
    return 'green';
  };

  /**
   * Filter databases by search term
   */
  const filteredDatabases = databases.filter((db) =>
    searchTerm
      ? (db.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        db.customer.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading database instances...
        </Text>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontWeight="medium">
          Failed to load database metrics
        </Text>
      </Box>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">
            Database Instances
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Managed database allocation and resource monitoring
          </Text>
        </Box>

        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Create Instance
        </Button>
      </HStack>

      {/* Key Metrics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(6, 1fr)' }} gap={6}>
        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Instances</StatLabel>
          <StatNumber color="blue.600">{summary.totalInstances}</StatNumber>
          <StatHelpText>Active databases</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total vCPU</StatLabel>
          <StatNumber color="purple.600">{summary.totalVCpu}</StatNumber>
          <StatHelpText>Allocated cores</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Storage</StatLabel>
          <StatNumber color="green.600">{summary.totalStorage} GB</StatNumber>
          <StatHelpText>Allocated space</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Avg vCPU Usage</StatLabel>
          <StatNumber color={summary.avgVCpuUtilization > 80 ? 'red.600' : 'green.600'}>
            {summary.avgVCpuUtilization.toFixed(1)}%
          </StatNumber>
          <StatHelpText>Resource utilization</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Avg Storage Usage</StatLabel>
          <StatNumber color={summary.avgStorageUtilization > 80 ? 'red.600' : 'green.600'}>
            {summary.avgStorageUtilization.toFixed(1)}%
          </StatNumber>
          <StatHelpText>Disk utilization</StatHelpText>
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
          <StatNumber color="orange.600">
            ${summary.totalMonthlyRevenue.toLocaleString()}
          </StatNumber>
          <StatHelpText>Total billing</StatHelpText>
        </Stat>
      </Grid>

      <Divider />

      {/* Charts Section */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Tier Distribution Bar Chart */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Tier Distribution
          </Heading>

          {tierDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tierDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3182ce" name="Instances" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No tier distribution data available
            </Text>
          )}
        </Box>

        {/* Resource Utilization Trends */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Resource Utilization Trends
          </Heading>

          {utilizationTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={utilizationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="vCpu"
                  stroke="#3182ce"
                  fill="#3182ce"
                  fillOpacity={0.3}
                  name="vCPU Usage (%)"
                />
                <Area
                  type="monotone"
                  dataKey="storage"
                  stroke="#38a169"
                  fill="#38a169"
                  fillOpacity={0.3}
                  name="Storage Usage (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No utilization trend data available
            </Text>
          )}
        </Box>
      </Grid>

      {/* Filters Section */}
      <Box
        bg="white"
        p={4}
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Search Customer
            </Text>
            <Input
              placeholder="Customer name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Tier
            </Text>
            <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
              <option value="">All Tiers</option>
              <option value="Startup">Startup</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Government">Government</option>
            </Select>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Database Type
            </Text>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="SQL">SQL</option>
              <option value="NoSQL">NoSQL</option>
              <option value="Graph">Graph</option>
              <option value="TimeSeries">TimeSeries</option>
            </Select>
          </Box>
        </Grid>
      </Box>

      {/* Database Instances Table */}
      <Box
        bg="white"
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
        overflowX="auto"
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Customer</Th>
              <Th>Tier</Th>
              <Th>Type</Th>
              <Th isNumeric>vCPU</Th>
              <Th isNumeric>Storage (GB)</Th>
              <Th>vCPU Usage</Th>
              <Th>Storage Usage</Th>
              <Th>Auto-Scale</Th>
              <Th isNumeric>Monthly Bill</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredDatabases.length === 0 ? (
              <Tr>
                <Td colSpan={9} textAlign="center" py={8}>
                  <Text color="gray.500">No database instances found</Text>
                </Td>
              </Tr>
            ) : (
              filteredDatabases.map((db) => (
                <Tr key={db._id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium" fontSize="sm">
                        {db.customerName || 'Unknown'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {db.customer}
                      </Text>
                    </VStack>
                  </Td>

                  <Td>
                    <Badge colorScheme={getTierColor(db.tier)}>{db.tier}</Badge>
                  </Td>

                  <Td>
                    <Badge colorScheme={getTypeColor(db.databaseType)}>{db.databaseType}</Badge>
                  </Td>

                  <Td isNumeric fontSize="sm">
                    {db.allocatedVCpu}
                  </Td>

                  <Td isNumeric fontSize="sm">
                    {db.allocatedStorage}
                  </Td>

                  <Td>
                    <VStack align="stretch" spacing={1}>
                      <Progress
                        value={db.vCpuUtilization}
                        colorScheme={getUtilizationStatus(db.vCpuUtilization)}
                        size="sm"
                        borderRadius="full"
                      />
                      <Text fontSize="xs" color="gray.600">
                        {db.vCpuUtilization.toFixed(1)}%
                      </Text>
                    </VStack>
                  </Td>

                  <Td>
                    <VStack align="stretch" spacing={1}>
                      <Progress
                        value={db.storageUtilization}
                        colorScheme={getUtilizationStatus(db.storageUtilization)}
                        size="sm"
                        borderRadius="full"
                      />
                      <Text fontSize="xs" color="gray.600">
                        {db.storageUtilization.toFixed(1)}%
                      </Text>
                    </VStack>
                  </Td>

                  <Td>
                    <Badge colorScheme={db.autoScalingEnabled ? 'green' : 'gray'}>
                      {db.autoScalingEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </Td>

                  <Td isNumeric fontWeight="semibold" color="green.600">
                    ${db.monthlyBill.toLocaleString()}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Create Database Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiDatabase />
              <Text>Create Database Instance</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tier</FormLabel>
                <Select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                >
                  <option value="Startup">Startup (2 vCPU, 50 GB)</option>
                  <option value="Enterprise">Enterprise (8 vCPU, 500 GB)</option>
                  <option value="Government">Government (32 vCPU, 2000 GB)</option>
                </Select>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Tier determines default resource allocations
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Database Type</FormLabel>
                <Select
                  value={formData.databaseType}
                  onChange={(e) =>
                    setFormData({ ...formData, databaseType: e.target.value as any })
                  }
                >
                  <option value="SQL">SQL (PostgreSQL, MySQL)</option>
                  <option value="NoSQL">NoSQL (MongoDB, Cassandra)</option>
                  <option value="Graph">Graph (Neo4j, ArangoDB)</option>
                  <option value="TimeSeries">TimeSeries (InfluxDB, TimescaleDB)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Customer ID</FormLabel>
                <Input
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  placeholder="Enter customer ID"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Auto-Scaling</FormLabel>
                <Select
                  value={formData.autoScalingEnabled ? 'true' : 'false'}
                  onChange={(e) =>
                    setFormData({ ...formData, autoScalingEnabled: e.target.value === 'true' })
                  }
                >
                  <option value="true">Enabled (scales at 80% utilization)</option>
                  <option value="false">Disabled (manual scaling)</option>
                </Select>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Auto-scaling triggers at 80% vCPU or storage utilization
                </Text>
              </FormControl>

              <Box
                p={3}
                bg="blue.50"
                borderRadius="md"
                border="1px solid"
                borderColor="blue.200"
                w="full"
              >
                <Text fontSize="sm" fontWeight="semibold" mb={1}>
                  Pricing Information
                </Text>
                <Text fontSize="xs" color="gray.700">
                  • Base: $200 + (vCPU × $20) + (storage GB × $0.50)
                  <br />
                  • Volume discounts: 10% if bill {'>'}$1k, 20% if {'>'}$10k
                  <br />• Replication cost included in tier pricing
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreate}
              isLoading={submitting}
              isDisabled={!formData.customerId}
            >
              Create Instance
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
 *    - Filter section with search, tier, and type dropdowns
 *    - Modal-based instance creation workflow
 *    - Table with dual Progress bars (vCPU + storage)
 *    - Real-time utilization monitoring
 * 
 * 2. DATA FLOW:
 *    - useCallback for fetchDatabases (memoized with filter dependencies)
 *    - useEffect triggers fetch on filter changes
 *    - Client-side search filtering for performance
 *    - Toast notifications for all actions
 * 
 * 3. TIER SYSTEM:
 *    - Startup: 2 vCPU, 50 GB storage (small businesses)
 *    - Enterprise: 8 vCPU, 500 GB (standard customers)
 *    - Government: 32 vCPU, 2000 GB (high-security)
 *    - Default allocations applied at creation
 * 
 * 4. VISUALIZATIONS:
 *    - Tier distribution: BarChart with instance counts
 *    - Utilization trends: Dual AreaChart (vCPU + storage)
 *    - Table: Inline Progress bars for real-time metrics
 * 
 * 5. AUTO-SCALING:
 *    - Enabled/disabled toggle in creation modal
 *    - Triggers at 80% vCPU or storage utilization
 *    - Badge display in table for quick status check
 * 
 * 6. BILLING:
 *    - Volume discount information in modal
 *    - Monthly bill displayed per instance
 *    - Total revenue in summary metrics
 */

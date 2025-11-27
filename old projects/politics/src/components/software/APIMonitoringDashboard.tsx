/**
 * @file src/components/software/APIMonitoringDashboard.tsx
 * @description API endpoint performance monitoring and SLA tracking
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Dashboard for Technology/Software companies monitoring API endpoint performance,
 * rate limiting, revenue tracking, and SLA compliance. Tracks uptime, response times,
 * error rates, and customer impact for REST, GraphQL, WebSocket, and gRPC endpoints.
 * Provides real-time visibility into API health and monetization.
 * 
 * FEATURES:
 * - API endpoint registration with rate limit configuration
 * - Performance SLA monitoring (99.9% uptime, <200ms p95, <1% error rate)
 * - Call volume tracking with LineChart visualization
 * - Health status distribution with PieChart (Healthy/Degraded/Down)
 * - Error rate trends with AreaChart
 * - Rate limiting display (per minute/hour/day)
 * - Revenue per endpoint with pricing analytics
 * - Customer impact warnings for degraded endpoints
 * - Endpoint type filtering (REST/GraphQL/WebSocket/gRPC)
 * 
 * BUSINESS LOGIC:
 * - Pricing: $0.001 per API call
 * - Rate limits: Default 100/min, 5k/hour, 100k/day
 * - Health criteria: Uptime ≥99%, errorRate <1%, p95 latency <200ms
 * - Status transitions: Healthy → Degraded → Down
 * - Customer impact: Track active customers per endpoint
 * - Monthly revenue: callsPerMonth × pricePerCall
 * - Alert thresholds: Error rate >1%, uptime <99%
 * 
 * USAGE:
 * ```tsx
 * import APIMonitoringDashboard from '@/components/software/APIMonitoringDashboard';
 * 
 * <APIMonitoringDashboard companyId={companyId} />
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
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
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
import { FiPlus, FiActivity, FiAlertTriangle } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface APIMonitoringDashboardProps {
  companyId: string;
  endpointType?: string;
}

interface APIEndpoint {
  _id: string;
  company: string;
  path: string;
  method: string;
  endpointType: 'REST' | 'GraphQL' | 'WebSocket' | 'gRPC';
  authMethod: string;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  pricePerCall: number;
  totalCalls: number;
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  activeCustomers: number;
  isHealthy: boolean;
  createdAt: string;
}

interface CallTrend {
  date: string;
  calls: number;
  revenue: number;
}

interface HealthSummary {
  healthy: number;
  degraded: number;
  down: number;
}

interface ErrorTrend {
  date: string;
  errorRate: number;
}

interface EndpointSummary {
  totalEndpoints: number;
  totalCalls: number;
  monthlyRevenue: number;
  avgResponseTime: number;
  avgErrorRate: number;
  avgUptime: number;
}

// Chart colors
const HEALTH_COLORS = {
  healthy: '#38a169',
  degraded: '#d69e2e',
  down: '#e53e3e',
};

// ============================================================================
// Main Component
// ============================================================================

export default function APIMonitoringDashboard({
  companyId,
  endpointType,
}: APIMonitoringDashboardProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [summary, setSummary] = useState<EndpointSummary | null>(null);
  const [callTrends, setCallTrends] = useState<CallTrend[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [errorTrends, setErrorTrends] = useState<ErrorTrend[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>(endpointType || '');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    path: '',
    method: 'GET',
    endpointType: 'REST' as 'REST' | 'GraphQL' | 'WebSocket' | 'gRPC',
    authMethod: 'API_KEY',
    rateLimitPerMinute: 100,
    rateLimitPerHour: 5000,
    rateLimitPerDay: 100000,
    pricePerCall: 0.001,
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch API endpoints and metrics
   */
  const fetchEndpoints = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId });
      if (typeFilter) params.append('endpointType', typeFilter);

      const response = await fetch(`/api/monitoring/endpoints?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch API endpoints');
      }

      const data = await response.json();

      if (data.success) {
        setEndpoints(data.endpoints || []);
        setSummary(data.aggregatedMetrics || null);
        setCallTrends(data.callTrends || []);
        setHealthSummary(data.healthSummary || null);
        setErrorTrends(data.errorTrends || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching endpoints:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load API endpoints',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, typeFilter, toast]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  // ============================================================================
  // Endpoint Creation
  // ============================================================================

  /**
   * Register new API endpoint
   */
  const handleRegister = async () => {
    if (!formData.path) {
      toast({
        title: 'Validation Error',
        description: 'Endpoint path is required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/monitoring/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyId,
          path: formData.path,
          method: formData.method,
          endpointType: formData.endpointType,
          authMethod: formData.authMethod,
          rateLimitPerMinute: formData.rateLimitPerMinute,
          rateLimitPerHour: formData.rateLimitPerHour,
          rateLimitPerDay: formData.rateLimitPerDay,
          pricePerCall: formData.pricePerCall,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register endpoint');
      }

      const data = await response.json();

      toast({
        title: 'Endpoint Registered',
        description: `${data.endpoint.method} ${data.endpoint.path} registered successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setFormData({
        path: '',
        method: 'GET',
        endpointType: 'REST',
        authMethod: 'API_KEY',
        rateLimitPerMinute: 100,
        rateLimitPerHour: 5000,
        rateLimitPerDay: 100000,
        pricePerCall: 0.001,
      });
      onClose();
      fetchEndpoints();
    } catch (error: any) {
      console.error('Error registering endpoint:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register endpoint',
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
   * Get health status badge
   */
  const getHealthStatus = (endpoint: APIEndpoint): { status: string; color: string } => {
    if (endpoint.uptime >= 99 && endpoint.errorRate < 1 && endpoint.avgResponseTime < 200) {
      return { status: 'Healthy', color: 'green' };
    } else if (endpoint.uptime >= 95 && endpoint.errorRate < 5) {
      return { status: 'Degraded', color: 'yellow' };
    } else {
      return { status: 'Down', color: 'red' };
    }
  };

  /**
   * Get endpoint type badge color
   */
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'REST':
        return 'blue';
      case 'GraphQL':
        return 'purple';
      case 'WebSocket':
        return 'green';
      case 'gRPC':
        return 'orange';
      default:
        return 'gray';
    }
  };

  /**
   * Filter endpoints by search term
   */
  const filteredEndpoints = endpoints.filter((ep) =>
    searchTerm
      ? ep.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.method.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  /**
   * Get degraded endpoints count
   */
  const degradedCount = endpoints.filter((ep) => {
    const health = getHealthStatus(ep);
    return health.status === 'Degraded' || health.status === 'Down';
  }).length;

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading API monitoring...
        </Text>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontWeight="medium">
          Failed to load API monitoring data
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
            API Monitoring
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Endpoint performance and SLA tracking
          </Text>
        </Box>

        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Register Endpoint
        </Button>
      </HStack>

      {/* SLA Violation Alert */}
      {degradedCount > 0 && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">SLA Violations Detected</Text>
            <Text fontSize="sm">
              {degradedCount} endpoint{degradedCount > 1 ? 's' : ''} degraded or down. Customer
              impact assessment required.
            </Text>
          </Box>
        </Alert>
      )}

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
          <StatLabel>Total Endpoints</StatLabel>
          <StatNumber color="blue.600">{summary.totalEndpoints}</StatNumber>
          <StatHelpText>Registered APIs</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Calls</StatLabel>
          <StatNumber color="purple.600">{summary.totalCalls.toLocaleString()}</StatNumber>
          <StatHelpText>Last 30 days</StatHelpText>
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
          <StatNumber color="green.600">${summary.monthlyRevenue.toLocaleString()}</StatNumber>
          <StatHelpText>API monetization</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Avg Response Time</StatLabel>
          <StatNumber color={summary.avgResponseTime > 200 ? 'red.600' : 'green.600'}>
            {summary.avgResponseTime.toFixed(0)}ms
          </StatNumber>
          <StatHelpText>
            {summary.avgResponseTime > 200 ? (
              <StatArrow type="increase" />
            ) : (
              <StatArrow type="decrease" />
            )}
            Target: {'<'}200ms
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
          <StatLabel>Error Rate</StatLabel>
          <StatNumber color={summary.avgErrorRate > 1 ? 'red.600' : 'green.600'}>
            {summary.avgErrorRate.toFixed(2)}%
          </StatNumber>
          <StatHelpText>Target: {'<'}1%</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Uptime</StatLabel>
          <StatNumber color={summary.avgUptime >= 99 ? 'green.600' : 'red.600'}>
            {summary.avgUptime.toFixed(2)}%
          </StatNumber>
          <StatHelpText>Target: ≥99.9%</StatHelpText>
        </Stat>
      </Grid>

      <Divider />

      {/* Charts Section */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Call Volume Trends */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            API Call Volume
          </Heading>

          {callTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={callTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="calls"
                  stroke="#3182ce"
                  strokeWidth={2}
                  name="API Calls"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#38a169"
                  strokeWidth={2}
                  name="Revenue ($)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No call trend data available
            </Text>
          )}
        </Box>

        {/* Health Status Distribution */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Health Status Distribution
          </Heading>

          {healthSummary && (healthSummary.healthy + healthSummary.degraded + healthSummary.down) > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Healthy', value: healthSummary.healthy },
                    { name: 'Degraded', value: healthSummary.degraded },
                    { name: 'Down', value: healthSummary.down },
                  ].filter((item) => item.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                >
                  <Cell fill={HEALTH_COLORS.healthy} />
                  <Cell fill={HEALTH_COLORS.degraded} />
                  <Cell fill={HEALTH_COLORS.down} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No health status data available
            </Text>
          )}
        </Box>
      </Grid>

      {/* Error Rate Trends */}
      <Box
        bg="white"
        p={6}
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <Heading size="md" mb={4}>
          Error Rate Trends
        </Heading>

        {errorTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={errorTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="errorRate"
                stroke="#e53e3e"
                fill="#e53e3e"
                fillOpacity={0.3}
                name="Error Rate (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Text color="gray.500" textAlign="center" py={8}>
            No error trend data available
          </Text>
        )}
      </Box>

      {/* Filters Section */}
      <Box
        bg="white"
        p={4}
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Search Endpoint
            </Text>
            <Input
              placeholder="Path or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Endpoint Type
            </Text>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="REST">REST</option>
              <option value="GraphQL">GraphQL</option>
              <option value="WebSocket">WebSocket</option>
              <option value="gRPC">gRPC</option>
            </Select>
          </Box>
        </Grid>
      </Box>

      {/* Endpoints Table */}
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
              <Th>Endpoint</Th>
              <Th>Type</Th>
              <Th>Health</Th>
              <Th isNumeric>Calls</Th>
              <Th isNumeric>Uptime</Th>
              <Th isNumeric>Avg Response</Th>
              <Th isNumeric>Error Rate</Th>
              <Th isNumeric>Customers</Th>
              <Th isNumeric>Revenue</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredEndpoints.length === 0 ? (
              <Tr>
                <Td colSpan={9} textAlign="center" py={8}>
                  <Text color="gray.500">No API endpoints found</Text>
                </Td>
              </Tr>
            ) : (
              filteredEndpoints.map((ep) => {
                const health = getHealthStatus(ep);
                return (
                  <Tr key={ep._id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" fontSize="sm">
                          {ep.method} {ep.path}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Rate: {ep.rateLimitPerMinute}/min
                        </Text>
                      </VStack>
                    </Td>

                    <Td>
                      <Badge colorScheme={getTypeColor(ep.endpointType)}>{ep.endpointType}</Badge>
                    </Td>

                    <Td>
                      <HStack spacing={2}>
                        <Badge colorScheme={health.color}>{health.status}</Badge>
                        {health.status !== 'Healthy' && <FiAlertTriangle color="orange" />}
                      </HStack>
                    </Td>

                    <Td isNumeric fontSize="sm">
                      {ep.totalCalls.toLocaleString()}
                    </Td>

                    <Td isNumeric>
                      <VStack align="stretch" spacing={1}>
                        <Progress
                          value={ep.uptime}
                          colorScheme={ep.uptime >= 99 ? 'green' : 'red'}
                          size="sm"
                          borderRadius="full"
                        />
                        <Text fontSize="xs" color="gray.600">
                          {ep.uptime.toFixed(2)}%
                        </Text>
                      </VStack>
                    </Td>

                    <Td isNumeric fontSize="sm" color={ep.avgResponseTime > 200 ? 'red.600' : 'green.600'}>
                      {ep.avgResponseTime.toFixed(0)}ms
                    </Td>

                    <Td isNumeric fontSize="sm" color={ep.errorRate > 1 ? 'red.600' : 'green.600'}>
                      {ep.errorRate.toFixed(2)}%
                    </Td>

                    <Td isNumeric fontWeight="semibold">
                      {ep.activeCustomers}
                    </Td>

                    <Td isNumeric fontWeight="semibold" color="green.600">
                      ${(ep.totalCalls * ep.pricePerCall).toFixed(2)}
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Register Endpoint Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiActivity />
              <Text>Register API Endpoint</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <FormControl isRequired>
                  <FormLabel>HTTP Method</FormLabel>
                  <Select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Endpoint Type</FormLabel>
                  <Select
                    value={formData.endpointType}
                    onChange={(e) =>
                      setFormData({ ...formData, endpointType: e.target.value as any })
                    }
                  >
                    <option value="REST">REST</option>
                    <option value="GraphQL">GraphQL</option>
                    <option value="WebSocket">WebSocket</option>
                    <option value="gRPC">gRPC</option>
                  </Select>
                </FormControl>
              </Grid>

              <FormControl isRequired>
                <FormLabel>Endpoint Path</FormLabel>
                <Input
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/api/v1/users"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Authentication Method</FormLabel>
                <Select
                  value={formData.authMethod}
                  onChange={(e) => setFormData({ ...formData, authMethod: e.target.value })}
                >
                  <option value="API_KEY">API Key</option>
                  <option value="OAuth2">OAuth 2.0</option>
                  <option value="JWT">JWT Bearer Token</option>
                  <option value="BasicAuth">Basic Auth</option>
                </Select>
              </FormControl>

              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Rate Limit (per min)</FormLabel>
                  <NumberInput
                    value={formData.rateLimitPerMinute}
                    onChange={(valueString) =>
                      setFormData({
                        ...formData,
                        rateLimitPerMinute: parseInt(valueString) || 0,
                      })
                    }
                    min={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Per Hour</FormLabel>
                  <NumberInput
                    value={formData.rateLimitPerHour}
                    onChange={(valueString) =>
                      setFormData({ ...formData, rateLimitPerHour: parseInt(valueString) || 0 })
                    }
                    min={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Per Day</FormLabel>
                  <NumberInput
                    value={formData.rateLimitPerDay}
                    onChange={(valueString) =>
                      setFormData({ ...formData, rateLimitPerDay: parseInt(valueString) || 0 })
                    }
                    min={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </Grid>

              <FormControl isRequired>
                <FormLabel>Price per Call ($)</FormLabel>
                <NumberInput
                  value={formData.pricePerCall}
                  onChange={(valueString) =>
                    setFormData({ ...formData, pricePerCall: parseFloat(valueString) || 0 })
                  }
                  min={0}
                  step={0.001}
                  precision={3}
                >
                  <NumberInputField />
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Default: $0.001 per call
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
                  SLA Targets
                </Text>
                <Text fontSize="xs" color="gray.700">
                  • Uptime: ≥99.9% (43 min/month downtime)
                  <br />
                  • Response Time: {'<'}200ms (p95 latency)
                  <br />• Error Rate: {'<'}1% of total requests
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
              onClick={handleRegister}
              isLoading={submitting}
              isDisabled={!formData.path}
            >
              Register Endpoint
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
 *    - SLA violation alerts for degraded/down endpoints
 *    - Filter section with search and type dropdown
 *    - Modal-based endpoint registration workflow
 *    - Table with health status indicators and Progress bars
 * 
 * 2. DATA FLOW:
 *    - useCallback for fetchEndpoints (memoized with type filter)
 *    - useEffect triggers fetch on filter changes
 *    - Client-side search filtering for performance
 *    - Toast notifications for all actions
 * 
 * 3. HEALTH MONITORING:
 *    - Healthy: Uptime ≥99%, errorRate <1%, responseTime <200ms
 *    - Degraded: Uptime ≥95%, errorRate <5%
 *    - Down: Below degraded thresholds
 *    - Visual indicators (badges, icons, progress bars)
 * 
 * 4. VISUALIZATIONS:
 *    - Call volume: Dual-axis LineChart (calls + revenue)
 *    - Health distribution: PieChart with color-coded statuses
 *    - Error trends: AreaChart showing error rate over time
 * 
 * 5. RATE LIMITING:
 *    - Three-tier limits (per minute/hour/day)
 *    - Displayed in registration modal and table
 *    - Default: 100/min, 5k/hour, 100k/day
 * 
 * 6. REVENUE TRACKING:
 *    - Per-call pricing ($0.001 default)
 *    - Monthly revenue calculated from total calls
 *    - Revenue displayed per endpoint and in aggregate metrics
 */

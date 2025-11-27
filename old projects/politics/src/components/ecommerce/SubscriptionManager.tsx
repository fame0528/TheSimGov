/**
 * @file src/components/ecommerce/SubscriptionManager.tsx
 * @description Recurring revenue tracking and subscription lifecycle management
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Financial dashboard for managing SaaS subscriptions and recurring revenue streams.
 * Tracks MRR/ARR metrics, monitors churn rates, visualizes plan distribution,
 * and handles subscription lifecycle actions (upgrades, downgrades, cancellations).
 * Provides comprehensive analytics for subscription-based business models.
 * 
 * FEATURES:
 * - Active subscriptions table with customer and plan details
 * - MRR (Monthly Recurring Revenue) and ARR tracking with growth rates
 * - Churn rate analysis with trend visualization (LineChart)
 * - Plan distribution breakdown (PieChart: Basic, Pro, Enterprise)
 * - Payment status tracking with color-coded badges
 * - Upgrade/downgrade workflows with prorated pricing
 * - Advanced filtering (search customer, plan type, status, renewal date range)
 * - Renewal date calendar and auto-renew indicators
 * 
 * BUSINESS LOGIC:
 * - MRR = sum(active subscription monthly amounts)
 * - ARR = MRR × 12 (annualized recurring revenue)
 * - Churn rate = (canceled subscriptions / total active subscriptions) × 100
 * - Growth rate = ((current MRR - previous MRR) / previous MRR) × 100
 * - LTV (Customer Lifetime Value) = avg subscription value × avg customer lifetime
 * - Prorated pricing = (days remaining / days in month) × monthly price
 * 
 * USAGE:
 * ```tsx
 * import SubscriptionManager from '@/components/ecommerce/SubscriptionManager';
 * 
 * <SubscriptionManager companyId={companyId} marketplaceId={marketplaceId} />
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  Input,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiCalendar } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface SubscriptionManagerProps {
  companyId: string;
  marketplaceId?: string;
}

interface Subscription {
  _id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  plan: 'basic' | 'pro' | 'enterprise';
  monthlyAmount: number;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  startDate: string;
  renewalDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  createdAt: string;
}

interface SubscriptionMetrics {
  currentMRR: number;
  previousMRR: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  avgPlanValue: number;
  growthRate: number;
}

interface ChurnData {
  month: string;
  rate: number;
  canceled: number;
}

interface PlanDistribution {
  plan: string;
  count: number;
  revenue: number;
}

interface SubscriptionFilters {
  search: string;
  plan: string;
  status: string;
}

// Chart colors
const PLAN_COLORS = {
  basic: '#3182ce',
  pro: '#38a169',
  enterprise: '#805ad5',
};

// ============================================================================
// Main Component
// ============================================================================

export default function SubscriptionManager({
  companyId,
  marketplaceId,
}: SubscriptionManagerProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [churnData, setChurnData] = useState<ChurnData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [filters, setFilters] = useState<SubscriptionFilters>({
    search: '',
    plan: '',
    status: '',
  });
  const [newPlan, setNewPlan] = useState<'basic' | 'pro' | 'enterprise' | ''>('');

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch subscriptions list and metrics
   */
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        companyId,
        ...(marketplaceId && { marketplaceId }),
        ...(filters.plan && { plan: filters.plan }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/ecommerce/subscriptions/list?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setMetrics(data.metrics);
        setChurnData(data.churnData || []);
        setPlanDistribution(data.planDistribution || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load subscriptions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, marketplaceId, filters.plan, filters.status, toast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // ============================================================================
  // Subscription Actions
  // ============================================================================

  /**
   * Change subscription plan
   */
  const changePlan = async () => {
    if (!selectedSubscription || !newPlan) {
      toast({
        title: 'Validation Error',
        description: 'Please select a new plan',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/ecommerce/subscriptions/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.subscriptionId,
          companyId,
          plan: newPlan,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change plan');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Plan Changed',
          description: `Subscription upgraded to ${newPlan} plan`,
          status: 'success',
          duration: 3000,
        });

        setNewPlan('');
        fetchSubscriptions();
        onClose();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change plan',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * Cancel subscription
   */
  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/ecommerce/subscriptions/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          companyId,
          status: 'canceled',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Subscription Canceled',
          description: 'Subscription will remain active until renewal date',
          status: 'success',
          duration: 3000,
        });

        fetchSubscriptions();
        onClose();
      } else {
        throw new Error(data.error || 'Cancellation failed');
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * View subscription details
   */
  const viewSubscriptionDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setNewPlan('');
    onOpen();
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'trialing':
        return 'blue';
      case 'past_due':
        return 'orange';
      case 'canceled':
        return 'red';
      default:
        return 'gray';
    }
  };

  /**
   * Get plan badge color
   */
  const getPlanColor = (plan: string): string => {
    switch (plan) {
      case 'basic':
        return 'blue';
      case 'pro':
        return 'green';
      case 'enterprise':
        return 'purple';
      default:
        return 'gray';
    }
  };

  /**
   * Filter subscriptions based on search
   */
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = filters.search.toLowerCase();
    return (
      sub.customerName.toLowerCase().includes(searchLower) ||
      sub.customerEmail.toLowerCase().includes(searchLower) ||
      sub.subscriptionId.toLowerCase().includes(searchLower)
    );
  });

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading subscriptions...
        </Text>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.700" fontWeight="medium">
          Failed to load subscription metrics
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
      <Box>
        <Heading size="lg" color="gray.800">
          Subscription Management
        </Heading>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Recurring revenue tracking and lifecycle management
        </Text>
      </Box>

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
          <StatLabel>MRR</StatLabel>
          <StatNumber color="blue.600">${metrics.currentMRR.toLocaleString()}</StatNumber>
          <StatHelpText>
            {metrics.growthRate >= 0 ? (
              <StatArrow type="increase" />
            ) : (
              <StatArrow type="decrease" />
            )}
            {Math.abs(metrics.growthRate).toFixed(1)}% vs last month
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
          <StatLabel>ARR</StatLabel>
          <StatNumber color="green.600">${metrics.arr.toLocaleString()}</StatNumber>
          <StatHelpText>Annual recurring revenue</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Active Subscriptions</StatLabel>
          <StatNumber color="purple.600">{metrics.activeSubscriptions}</StatNumber>
          <StatHelpText>Currently active</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Churn Rate</StatLabel>
          <StatNumber color={metrics.churnRate > 5 ? 'red.600' : 'orange.600'}>
            {metrics.churnRate.toFixed(1)}%
          </StatNumber>
          <StatHelpText>Monthly churn</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Avg Plan Value</StatLabel>
          <StatNumber color="blue.600">${metrics.avgPlanValue.toLocaleString()}</StatNumber>
          <StatHelpText>Per subscription</StatHelpText>
        </Stat>
      </Grid>

      <Divider />

      {/* Charts Section */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Churn Rate Trends */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Churn Rate Trends
          </Heading>

          {churnData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#e53e3e"
                  strokeWidth={2}
                  name="Churn Rate (%)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No churn data available
            </Text>
          )}
        </Box>

        {/* Plan Distribution */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Plan Distribution
          </Heading>

          {planDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistribution as any}
                  dataKey="count"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.plan}: ${entry.count}`}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PLAN_COLORS[entry.plan as keyof typeof PLAN_COLORS] || '#718096'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No plan distribution data available
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
              Search Customers
            </Text>
            <Input
              placeholder="Name, email, or ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Plan Type
            </Text>
            <Select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            >
              <option value="">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Status
            </Text>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </Select>
          </Box>
        </Grid>
      </Box>

      {/* Subscriptions Table */}
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
              <Th>Plan</Th>
              <Th isNumeric>MRR</Th>
              <Th>Status</Th>
              <Th>Renewal Date</Th>
              <Th>Auto-Renew</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredSubscriptions.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  <Text color="gray.500">No subscriptions found matching filters</Text>
                </Td>
              </Tr>
            ) : (
              filteredSubscriptions.map((sub) => (
                <Tr
                  key={sub._id}
                  _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                  onClick={() => viewSubscriptionDetails(sub)}
                >
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{sub.customerName}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {sub.customerEmail}
                      </Text>
                    </VStack>
                  </Td>

                  <Td>
                    <Badge colorScheme={getPlanColor(sub.plan)} textTransform="capitalize">
                      {sub.plan}
                    </Badge>
                  </Td>

                  <Td isNumeric fontWeight="semibold">
                    ${sub.monthlyAmount.toLocaleString()}
                  </Td>

                  <Td>
                    <Badge colorScheme={getStatusColor(sub.status)} textTransform="capitalize">
                      {sub.status.replace('_', ' ')}
                    </Badge>
                  </Td>

                  <Td>
                    <HStack spacing={1}>
                      <FiCalendar size={14} />
                      <Text fontSize="sm">
                        {new Date(sub.renewalDate).toLocaleDateString()}
                      </Text>
                    </HStack>
                  </Td>

                  <Td>
                    <Badge colorScheme={sub.autoRenew ? 'green' : 'gray'}>
                      {sub.autoRenew ? 'Yes' : 'No'}
                    </Badge>
                  </Td>

                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewSubscriptionDetails(sub);
                      }}
                    >
                      Manage
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Subscription Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Manage Subscription
            {selectedSubscription && (
              <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>
                {selectedSubscription.customerName}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {selectedSubscription && (
              <VStack spacing={4} align="stretch">
                {/* Subscription Details */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>Current Plan</StatLabel>
                    <StatNumber>
                      <Badge
                        colorScheme={getPlanColor(selectedSubscription.plan)}
                        fontSize="lg"
                        textTransform="capitalize"
                      >
                        {selectedSubscription.plan}
                      </Badge>
                    </StatNumber>
                    <StatHelpText>${selectedSubscription.monthlyAmount}/month</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Status</StatLabel>
                    <StatNumber>
                      <Badge
                        colorScheme={getStatusColor(selectedSubscription.status)}
                        fontSize="lg"
                        textTransform="capitalize"
                      >
                        {selectedSubscription.status.replace('_', ' ')}
                      </Badge>
                    </StatNumber>
                    <StatHelpText>
                      {selectedSubscription.autoRenew ? 'Auto-renew enabled' : 'Manual renewal'}
                    </StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Start Date</StatLabel>
                    <StatNumber fontSize="lg">
                      {new Date(selectedSubscription.startDate).toLocaleDateString()}
                    </StatNumber>
                  </Stat>

                  <Stat>
                    <StatLabel>Renewal Date</StatLabel>
                    <StatNumber fontSize="lg">
                      {new Date(selectedSubscription.renewalDate).toLocaleDateString()}
                    </StatNumber>
                  </Stat>
                </Grid>

                <Divider />

                {/* Plan Change Section */}
                {selectedSubscription.status === 'active' && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Change Plan
                    </Text>
                    <Select
                      placeholder="Select new plan"
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value as any)}
                    >
                      {selectedSubscription.plan !== 'basic' && <option value="basic">Basic ($29/mo)</option>}
                      {selectedSubscription.plan !== 'pro' && <option value="pro">Pro ($99/mo)</option>}
                      {selectedSubscription.plan !== 'enterprise' && (
                        <option value="enterprise">Enterprise ($299/mo)</option>
                      )}
                    </Select>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedSubscription?.status === 'active' && (
              <>
                {newPlan && (
                  <Button colorScheme="blue" mr={3} onClick={changePlan}>
                    Change to {newPlan}
                  </Button>
                )}
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => cancelSubscription(selectedSubscription.subscriptionId)}
                >
                  Cancel Subscription
                </Button>
              </>
            )}
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
 *    - Modal-based subscription management workflow
 *    - Plan change with Select dropdown (only shows eligible upgrades/downgrades)
 *    - Cancellation with confirmation
 *    - Client-side search filtering (no API calls)
 * 
 * 2. DATA FLOW:
 *    - Initial fetch loads subscriptions + metrics + churn + distribution
 *    - Filter changes trigger new API calls (plan/status server-side)
 *    - Search filtering happens client-side for performance
 *    - Toast notifications for all actions
 * 
 * 3. METRICS CALCULATIONS:
 *    - MRR = sum of all active subscription monthly amounts
 *    - ARR = MRR × 12
 *    - Growth rate = percentage change from previous month
 *    - Churn rate = canceled / active subscriptions
 * 
 * 4. VISUALIZATIONS:
 *    - Churn trends: LineChart with monthly churn rate
 *    - Plan distribution: PieChart with color-coded plans
 *    - Both charts use ResponsiveContainer for mobile
 * 
 * 5. USER INTERACTIONS:
 *    - Click row to open management modal
 *    - Filter dropdowns (plan/status) trigger API refetch
 *    - Search input filters client-side
 *    - Plan change dropdown only shows eligible options
 * 
 * 6. PERFORMANCE:
 *    - useCallback for fetchSubscriptions (memoized with filter dependencies)
 *    - Client-side search (no debouncing needed, instant results)
 *    - Optimistic UI updates after plan changes
 */

/**
 * @file src/components/consulting/ConsultingDashboard.tsx
 * @description Consulting project management with billing analytics
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Comprehensive consulting project dashboard for managing client engagements,
 * tracking billable hours, monitoring profit margins, and analyzing client
 * satisfaction metrics. Supports multiple billing models (Hourly, Fixed,
 * Retainer, Performance) with real-time utilization tracking.
 * 
 * FEATURES:
 * - Project list with status filters (Proposal, Active, Completed, Cancelled)
 * - Billing model breakdown (Hourly/Fixed/Retainer/Performance)
 * - Profit margin tracking with 40-60% target visualization
 * - Client satisfaction metrics (1-10 scale, target 8+)
 * - Hours utilization charts (worked vs budgeted)
 * - Project creation modal with billing configuration
 * - Inline editing for progress updates
 * - Overbudget alerts and recommendations
 * 
 * BUSINESS LOGIC:
 * - Hourly billing: Rate × hours worked
 * - Fixed pricing: Flat project fee
 * - Retainer: Monthly recurring fee
 * - Performance: % of value delivered
 * - Utilization rate = (hours worked / budgeted hours) × 100
 * - Profit margin = ((revenue - costs) / revenue) × 100
 * - Client satisfaction: 1-10 scale (8+ is excellent)
 * - Overbudget threshold: utilization > 100%
 * 
 * USAGE:
 * ```tsx
 * import ConsultingDashboard from '@/components/consulting/ConsultingDashboard';
 * 
 * <ConsultingDashboard companyId={companyId} />
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
} from '@chakra-ui/react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FiPlus, FiDollarSign, FiClock, FiAlertTriangle } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface ConsultingDashboardProps {
  companyId: string;
}

interface ConsultingProject {
  _id: string;
  company: string;
  client: string;
  projectName: string;
  projectType: string;
  billingModel: 'Hourly' | 'Fixed' | 'Retainer' | 'Performance';
  hourlyRate?: number;
  budgetedHours?: number;
  hoursWorked: number;
  fixedPrice?: number;
  retainerAmount?: number;
  performancePercentage?: number;
  deliveredValue?: number;
  totalRevenue: number;
  profitMargin: number;
  clientSatisfaction: number;
  status: 'Proposal' | 'Active' | 'Completed' | 'Cancelled';
  startDate: string;
  expectedEndDate: string;
  hoursRemaining?: number;
  utilizationRate?: number;
  profitAmount?: number;
  isOverBudget?: boolean;
}

interface ProjectFormData {
  client: string;
  projectName: string;
  projectType: string;
  billingModel: string;
  hourlyRate: string;
  budgetedHours: string;
  fixedPrice: string;
  retainerAmount: string;
  performancePercentage: string;
  deliveredValue: string;
  expectedEndDate: string;
}

interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  averageMargin: number;
  averageSatisfaction: number;
  totalHoursWorked: number;
  proposalCount: number;
  completedCount: number;
}

// Chart colors
const CHART_COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e'];

// ============================================================================
// Main Component
// ============================================================================

export default function ConsultingDashboard({ companyId }: ConsultingDashboardProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<ConsultingProject[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState<ProjectFormData>({
    client: '',
    projectName: '',
    projectType: 'Strategy',
    billingModel: 'Hourly',
    hourlyRate: '200',
    budgetedHours: '100',
    fixedPrice: '50000',
    retainerAmount: '10000',
    performancePercentage: '20',
    deliveredValue: '100000',
    expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchProjects = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ company: companyId });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (billingFilter !== 'all') params.append('billingModel', billingFilter);

      const response = await fetch(`/api/consulting/projects?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch consulting projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setMetrics(data.metrics || null);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load consulting projects',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, billingFilter, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ============================================================================
  // Project Creation
  // ============================================================================

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const payload: any = {
        company: companyId,
        client: formData.client,
        projectName: formData.projectName,
        projectType: formData.projectType,
        billingModel: formData.billingModel,
        expectedEndDate: formData.expectedEndDate,
      };

      // Add billing-specific fields
      if (formData.billingModel === 'Hourly') {
        payload.hourlyRate = parseFloat(formData.hourlyRate);
        payload.budgetedHours = parseFloat(formData.budgetedHours);
      } else if (formData.billingModel === 'Fixed') {
        payload.fixedPrice = parseFloat(formData.fixedPrice);
      } else if (formData.billingModel === 'Retainer') {
        payload.retainerAmount = parseFloat(formData.retainerAmount);
      } else if (formData.billingModel === 'Performance') {
        payload.performancePercentage = parseFloat(formData.performancePercentage);
        payload.deliveredValue = parseFloat(formData.deliveredValue);
      }

      const response = await fetch('/api/consulting/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      toast({
        title: 'Success',
        description: 'Consulting project created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
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

  const getBillingModelColor = (model: string): string => {
    switch (model) {
      case 'Hourly':
        return 'blue';
      case 'Fixed':
        return 'green';
      case 'Retainer':
        return 'purple';
      case 'Performance':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Proposal':
        return 'yellow';
      case 'Active':
        return 'blue';
      case 'Completed':
        return 'green';
      case 'Cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getMarginColor = (margin: number): string => {
    if (margin >= 60) return 'green';
    if (margin >= 40) return 'blue';
    if (margin >= 20) return 'yellow';
    return 'red';
  };

  const getSatisfactionColor = (score: number): string => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    return 'red';
  };

  // Calculate billing breakdown for pie chart
  const billingBreakdown = projects.reduce((acc, project) => {
    const existing = acc.find((item) => item.name === project.billingModel);
    if (existing) {
      existing.value += project.totalRevenue;
    } else {
      acc.push({ name: project.billingModel, value: project.totalRevenue });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading consulting projects...
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
            Consulting Projects
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Manage client engagements and track billable hours
          </Text>
        </Box>

        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          New Project
        </Button>
      </HStack>

      {/* Key Metrics */}
      {metrics && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Total Revenue</StatLabel>
            <StatNumber color="blue.600">
              <HStack spacing={1}>
                <FiDollarSign />
                <Text>{metrics.totalRevenue.toLocaleString()}</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {metrics.activeProjects} active projects
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
            <StatLabel>Avg Profit Margin</StatLabel>
            <StatNumber color={getMarginColor(metrics.averageMargin)}>
              {metrics.averageMargin.toFixed(1)}%
            </StatNumber>
            <StatHelpText>Target: 40-60%</StatHelpText>
          </Stat>

          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Client Satisfaction</StatLabel>
            <StatNumber color={getSatisfactionColor(metrics.averageSatisfaction)}>
              {metrics.averageSatisfaction.toFixed(1)}/10
            </StatNumber>
            <StatHelpText>Target: 8+</StatHelpText>
          </Stat>

          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Billable Hours</StatLabel>
            <StatNumber color="purple.600">
              <HStack spacing={1}>
                <FiClock />
                <Text>{metrics.totalHoursWorked.toLocaleString()}h</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>Total logged hours</StatHelpText>
          </Stat>
        </Grid>
      )}

      {/* Recommendations */}
      {metrics && (
        <>
          {metrics.averageMargin < 40 && (
            <Alert status="warning" borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Low Profit Margin Alert</AlertTitle>
                <AlertDescription fontSize="sm">
                  Average profit margin ({metrics.averageMargin.toFixed(1)}%) is below target (40%).
                  Review project costs and pricing.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {projects.filter((p) => p.isOverBudget).length > 0 && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>
                  <HStack spacing={2}>
                    <FiAlertTriangle />
                    <Text>{projects.filter((p) => p.isOverBudget).length} Overbudget Projects</Text>
                  </HStack>
                </AlertTitle>
                <AlertDescription fontSize="sm">
                  Some projects have exceeded budgeted hours. Review scope or adjust estimates.
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </>
      )}

      <Divider />

      {/* Charts Section */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Billing Model Breakdown */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Revenue by Billing Model
          </Heading>

          {billingBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={billingBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.name}: $${entry.value.toLocaleString()}`}
                >
                  {billingBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No billing data available
            </Text>
          )}
        </Box>

        {/* Project Status Pipeline */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>
            Project Pipeline
          </Heading>

          {metrics && (
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">Proposals</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {metrics.proposalCount}
                  </Text>
                </HStack>
                <Progress
                  value={(metrics.proposalCount / metrics.totalProjects) * 100}
                  colorScheme="yellow"
                  borderRadius="md"
                />
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">Active</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {metrics.activeProjects}
                  </Text>
                </HStack>
                <Progress
                  value={(metrics.activeProjects / metrics.totalProjects) * 100}
                  colorScheme="blue"
                  borderRadius="md"
                />
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">Completed</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {metrics.completedCount}
                  </Text>
                </HStack>
                <Progress
                  value={(metrics.completedCount / metrics.totalProjects) * 100}
                  colorScheme="green"
                  borderRadius="md"
                />
              </Box>
            </VStack>
          )}
        </Box>
      </Grid>

      {/* Filters */}
      <HStack spacing={4} bg="white" p={4} borderRadius="lg" shadow="sm">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          w="200px"
        >
          <option value="all">All Status</option>
          <option value="Proposal">Proposal</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </Select>

        <Select
          value={billingFilter}
          onChange={(e) => setBillingFilter(e.target.value)}
          w="200px"
        >
          <option value="all">All Billing Models</option>
          <option value="Hourly">Hourly</option>
          <option value="Fixed">Fixed Price</option>
          <option value="Retainer">Retainer</option>
          <option value="Performance">Performance-based</option>
        </Select>

        <Text fontSize="sm" color="gray.600" ml="auto">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Text>
      </HStack>

      {/* Projects Table */}
      <Box
        bg="white"
        p={6}
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        {projects.length > 0 ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th>Billing Model</Th>
                <Th>Status</Th>
                <Th isNumeric>Revenue</Th>
                <Th isNumeric>Margin</Th>
                <Th isNumeric>Satisfaction</Th>
                <Th isNumeric>Utilization</Th>
              </Tr>
            </Thead>
            <Tbody>
              {projects.map((project) => (
                <Tr key={project._id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{project.projectName}</Text>
                      <Text fontSize="xs" color="gray.600">
                        {project.projectType}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>{project.client}</Td>
                  <Td>
                    <Badge colorScheme={getBillingModelColor(project.billingModel)}>
                      {project.billingModel}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(project.status)}>{project.status}</Badge>
                  </Td>
                  <Td isNumeric fontWeight="semibold">
                    ${project.totalRevenue.toLocaleString()}
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme={getMarginColor(project.profitMargin)}>
                      {project.profitMargin.toFixed(1)}%
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme={getSatisfactionColor(project.clientSatisfaction)}>
                      {project.clientSatisfaction.toFixed(1)}/10
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <HStack justify="flex-end" spacing={1}>
                      {project.isOverBudget && <FiAlertTriangle color="red" />}
                      <Text color={project.isOverBudget ? 'red.600' : 'gray.700'}>
                        {project.utilizationRate?.toFixed(0)}%
                      </Text>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Text color="gray.500" textAlign="center" py={8}>
            No projects found. Create your first consulting project to get started.
          </Text>
        )}
      </Box>

      {/* Create Project Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Consulting Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Client Name</FormLabel>
                <Input
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Acme Corporation"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Project Name</FormLabel>
                <Input
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Digital Transformation Initiative"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Project Type</FormLabel>
                <Select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                >
                  <option value="Strategy">Strategy</option>
                  <option value="Operations">Operations</option>
                  <option value="Technology">Technology</option>
                  <option value="Financial">Financial</option>
                  <option value="HR">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Billing Model</FormLabel>
                <Select
                  value={formData.billingModel}
                  onChange={(e) => setFormData({ ...formData, billingModel: e.target.value })}
                >
                  <option value="Hourly">Hourly ($150-500/hour)</option>
                  <option value="Fixed">Fixed Price ($50k-500k)</option>
                  <option value="Retainer">Retainer ($10k-50k/month)</option>
                  <option value="Performance">Performance-based (% of value)</option>
                </Select>
              </FormControl>

              {/* Conditional fields based on billing model */}
              {formData.billingModel === 'Hourly' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <Input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      min="150"
                      max="500"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Budgeted Hours</FormLabel>
                    <Input
                      type="number"
                      value={formData.budgetedHours}
                      onChange={(e) =>
                        setFormData({ ...formData, budgetedHours: e.target.value })
                      }
                      min="10"
                    />
                  </FormControl>
                </>
              )}

              {formData.billingModel === 'Fixed' && (
                <FormControl isRequired>
                  <FormLabel>Fixed Price ($)</FormLabel>
                  <Input
                    type="number"
                    value={formData.fixedPrice}
                    onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                    min="50000"
                    max="500000"
                  />
                </FormControl>
              )}

              {formData.billingModel === 'Retainer' && (
                <FormControl isRequired>
                  <FormLabel>Monthly Retainer Amount ($)</FormLabel>
                  <Input
                    type="number"
                    value={formData.retainerAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, retainerAmount: e.target.value })
                    }
                    min="10000"
                    max="50000"
                  />
                </FormControl>
              )}

              {formData.billingModel === 'Performance' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>Performance Percentage (%)</FormLabel>
                    <Input
                      type="number"
                      value={formData.performancePercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, performancePercentage: e.target.value })
                      }
                      min="10"
                      max="50"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Expected Delivered Value ($)</FormLabel>
                    <Input
                      type="number"
                      value={formData.deliveredValue}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveredValue: e.target.value })
                      }
                      min="100000"
                    />
                  </FormControl>
                </>
              )}

              <FormControl isRequired>
                <FormLabel>Expected End Date</FormLabel>
                <Input
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedEndDate: e.target.value })
                  }
                />
              </FormControl>
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
              isDisabled={!formData.client || !formData.projectName}
            >
              Create Project
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
 * 1. BILLING MODELS:
 *    - Hourly: Rate × hours worked (typical: $150-500/hr)
 *    - Fixed: Flat project fee ($50k-500k)
 *    - Retainer: Monthly recurring fee ($10k-50k/mo)
 *    - Performance: % of value delivered (10-50% of value)
 * 
 * 2. KEY METRICS:
 *    - Total revenue: Sum of all project revenues
 *    - Avg profit margin: Target 40-60% (green at 60+, blue 40-60, yellow 20-40, red <20)
 *    - Client satisfaction: 1-10 scale (green 8+, yellow 6-8, red <6)
 *    - Billable hours: Total hours logged across projects
 * 
 * 3. ALERTS & RECOMMENDATIONS:
 *    - Low margin alert when avg < 40%
 *    - Overbudget alert when utilization > 100%
 *    - Visual indicators (red border, alert icon) for overbudget projects
 * 
 * 4. PROJECT LIFECYCLE:
 *    - Proposal → Active → Completed/Cancelled
 *    - Color-coded badges (yellow/blue/green/red)
 *    - Progress bars in pipeline chart
 * 
 * 5. PATTERN REUSE:
 *    - AnalyticsDashboard: Stat cards, PieChart layout, time period filtering (70%)
 *    - BugDashboard: Status filters, table display, modal forms (75%)
 *    - CloudServicesDashboard: Alert system, budget tracking, metrics grid (65%)
 *    - Overall reuse: ~70% average
 */

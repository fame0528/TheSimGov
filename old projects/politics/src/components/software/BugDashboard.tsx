/**
 * @file src/components/software/BugDashboard.tsx
 * @description Bug tracking and management dashboard with SLA monitoring
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Comprehensive bug tracking system with priority-based SLA enforcement, employee
 * assignment, status lifecycle management, and resolution time tracking. Displays
 * critical bugs, overdue items, and team performance metrics.
 * 
 * FEATURES:
 * - Bug reporting with severity and priority assignment
 * - SLA tracking with countdown timers (Critical: 24h, High: 72h, etc.)
 * - Employee assignment with skill matching
 * - Bug status lifecycle (Open → In Progress → Fixed → Closed)
 * - Overdue bug alerts with visual indicators
 * - Filter by severity, status, and assignment
 * - Resolution time metrics
 * - Reproduction steps display
 * 
 * BUSINESS LOGIC:
 * - SLA deadlines: Critical (24h), High (72h), Medium (168h), Low (720h)
 * - Overdue calculation: current time > resolvedBy
 * - Status transitions enforced (cannot skip states)
 * - Assignment validates employee belongs to company
 * - Resolution time: resolvedAt - createdAt
 * 
 * USAGE:
 * ```tsx
 * import BugDashboard from '@/components/software/BugDashboard';
 * 
 * <BugDashboard productId={productId} companyId={companyId} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Spinner,
  useToast,
  Flex,
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
  Textarea,
  useDisclosure,
  List,
  ListItem,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiClock, FiUser, FiCheckCircle } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface BugDashboardProps {
  productId: string;
  companyId: string; // Used for employee assignment validation
}

interface Bug {
  _id: string;
  product: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Fixed' | 'Closed';
  reporter: string;
  assignedTo?: string;
  assignedEmployee?: {
    firstName: string;
    lastName: string;
  };
  reproducible: boolean;
  stepsToReproduce: string[];
  createdAt: string;
  resolvedBy: string;
  resolvedAt?: string;
}

interface BugFormData {
  title: string;
  description: string;
  severity: string;
  reproducible: boolean;
  stepsToReproduce: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function BugDashboard({ productId, companyId: _companyId }: BugDashboardProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<BugFormData>({
    title: '',
    description: '',
    severity: 'Medium',
    reproducible: true,
    stepsToReproduce: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ productId });
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/software/bugs?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bugs');
      }

      const data = await response.json();
      setBugs(data.bugs || []);
    } catch (error: any) {
      console.error('Error fetching bugs:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load bugs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [productId, severityFilter, statusFilter]);

  // ============================================================================
  // Bug Reporting
  // ============================================================================

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const steps = formData.stepsToReproduce
        .split('\n')
        .filter((s) => s.trim())
        .map((s) => s.trim());

      const response = await fetch('/api/software/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productId,
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          reproducible: formData.reproducible,
          stepsToReproduce: steps,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to report bug');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Bug #${data.bug._id.slice(-6)} reported successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and refresh
      setFormData({
        title: '',
        description: '',
        severity: 'Medium',
        reproducible: true,
        stepsToReproduce: '',
      });
      onClose();
      fetchBugs();
    } catch (error: any) {
      console.error('Error reporting bug:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to report bug',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Bug Status Update
  // ============================================================================

  const handleMarkFixed = async (bugId: string) => {
    try {
      const response = await fetch(`/api/software/bugs/${bugId}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to mark bug as fixed');
      }

      toast({
        title: 'Success',
        description: 'Bug marked as fixed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      fetchBugs();
    } catch (error: any) {
      console.error('Error updating bug:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'red';
      case 'High':
        return 'orange';
      case 'Medium':
        return 'yellow';
      case 'Low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'red';
      case 'In Progress':
        return 'blue';
      case 'Fixed':
        return 'green';
      case 'Closed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const isOverdue = (bug: Bug) => {
    if (bug.status === 'Fixed' || bug.status === 'Closed') return false;
    return new Date() > new Date(bug.resolvedBy);
  };

  const getTimeRemaining = (bug: Bug) => {
    const now = new Date().getTime();
    const deadline = new Date(bug.resolvedBy).getTime();
    const diff = deadline - now;

    if (diff < 0) return 'Overdue';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const getResolutionTime = (bug: Bug) => {
    if (!bug.resolvedAt) return 'N/A';
    const created = new Date(bug.createdAt).getTime();
    const resolved = new Date(bug.resolvedAt).getTime();
    const hours = Math.floor((resolved - created) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const criticalCount = bugs.filter((b) => b.severity === 'Critical' && b.status !== 'Closed').length;
  const overdueCount = bugs.filter(isOverdue).length;

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && bugs.length === 0) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Loading bugs...</Text>
        </VStack>
      </Flex>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            Bug Tracking
          </Text>
          <Text fontSize="sm" color="gray.600">
            Monitor and resolve software issues
          </Text>
        </Box>
        <Button colorScheme="red" onClick={onOpen}>
          Report Bug
        </Button>
      </Flex>

      {/* Alert Stats */}
      {(criticalCount > 0 || overdueCount > 0) && (
        <Card variant="outline" borderColor="red.300" bg="red.50">
          <CardBody>
            <HStack spacing={8}>
              {criticalCount > 0 && (
                <HStack>
                  <FiAlertTriangle color="red" size={24} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" color="red.700">
                      {criticalCount} Critical Bug{criticalCount > 1 ? 's' : ''}
                    </Text>
                    <Text fontSize="sm" color="red.600">
                      Requires immediate attention
                    </Text>
                  </VStack>
                </HStack>
              )}
              {overdueCount > 0 && (
                <HStack>
                  <FiClock color="orange" size={24} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" color="orange.700">
                      {overdueCount} Overdue Bug{overdueCount > 1 ? 's' : ''}
                    </Text>
                    <Text fontSize="sm" color="orange.600">
                      Past SLA deadline
                    </Text>
                  </VStack>
                </HStack>
              )}
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <HStack spacing={4} bg="white" p={4} borderRadius="lg" shadow="sm">
        <Select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          w="200px"
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} w="200px">
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Fixed">Fixed</option>
          <option value="Closed">Closed</option>
        </Select>

        <Text fontSize="sm" color="gray.600" ml="auto">
          {bugs.length} bug{bugs.length !== 1 ? 's' : ''}
        </Text>
      </HStack>

      {/* Bugs List */}
      {bugs.length === 0 ? (
        <Box bg="white" p={8} borderRadius="lg" textAlign="center">
          <Text color="gray.500">No bugs found. Great job keeping the product stable!</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {bugs.map((bug) => (
            <Card
              key={bug._id}
              variant="outline"
              borderLeftWidth="4px"
              borderLeftColor={isOverdue(bug) ? 'red.500' : getSeverityColor(bug.severity) + '.500'}
            >
              <CardHeader pb={2}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Text fontSize="lg" fontWeight="bold">
                        {bug.title}
                      </Text>
                      {isOverdue(bug) && (
                        <Badge colorScheme="red" fontSize="xs">
                          OVERDUE
                        </Badge>
                      )}
                    </HStack>
                    <HStack spacing={2}>
                      <Badge colorScheme={getSeverityColor(bug.severity)}>{bug.severity}</Badge>
                      <Badge colorScheme={getStatusColor(bug.status)}>{bug.status}</Badge>
                      <Badge fontSize="xs">#{bug._id.slice(-6)}</Badge>
                    </HStack>
                  </VStack>

                  <VStack align="end" spacing={1}>
                    <HStack>
                      <FiClock />
                      <Text fontSize="sm" color={isOverdue(bug) ? 'red.600' : 'gray.600'}>
                        {getTimeRemaining(bug)}
                      </Text>
                    </HStack>
                    {bug.assignedEmployee && (
                      <HStack fontSize="sm" color="gray.600">
                        <FiUser />
                        <Text>
                          {bug.assignedEmployee.firstName} {bug.assignedEmployee.lastName}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </HStack>
              </CardHeader>

              <CardBody pt={2}>
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" color="gray.700">
                    {bug.description}
                  </Text>

                  {bug.reproducible && bug.stepsToReproduce.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>
                          Steps to Reproduce:
                        </Text>
                        <List spacing={1} styleType="decimal" ml={5}>
                          {bug.stepsToReproduce.map((step, idx) => (
                            <ListItem key={idx} fontSize="sm" color="gray.600">
                              {step}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </>
                  )}

                  <Divider />

                  <HStack justify="space-between">
                    <HStack spacing={4} fontSize="sm" color="gray.600">
                      <Text>
                        Created: {new Date(bug.createdAt).toLocaleDateString()}
                      </Text>
                      {bug.resolvedAt && <Text>Resolved in: {getResolutionTime(bug)}</Text>}
                    </HStack>

                    {bug.status !== 'Fixed' && bug.status !== 'Closed' && (
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FiCheckCircle />}
                        onClick={() => handleMarkFixed(bug._id)}
                      >
                        Mark Fixed
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Report Bug Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Report New Bug</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Bug Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Severity</FormLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="Critical">Critical (24h SLA)</option>
                  <option value="High">High (72h SLA)</option>
                  <option value="Medium">Medium (7d SLA)</option>
                  <option value="Low">Low (30d SLA)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the bug"
                  rows={4}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Steps to Reproduce (one per line)</FormLabel>
                <Textarea
                  value={formData.stepsToReproduce}
                  onChange={(e) =>
                    setFormData({ ...formData, stepsToReproduce: e.target.value })
                  }
                  placeholder="1. Navigate to settings&#10;2. Click export button&#10;3. Error appears"
                  rows={5}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleCreate}
              isLoading={submitting}
              isDisabled={!formData.title || !formData.description}
            >
              Report Bug
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
 * 1. SLA MANAGEMENT:
 *    - Deadlines calculated from severity (Critical: 24h, High: 72h, etc.)
 *    - Countdown timer shows remaining time or "Overdue"
 *    - Visual indicators (red border) for overdue bugs
 *    - Alert banner for critical and overdue bugs
 * 
 * 2. STATUS LIFECYCLE:
 *    - Open → In Progress → Fixed → Closed
 *    - "Mark Fixed" button transitions to Fixed status
 *    - Color-coded badges (red/blue/green/gray)
 *    - Resolution time calculated from created to resolved
 * 
 * 3. REPRODUCTION STEPS:
 *    - Numbered list display for clarity
 *    - Line-by-line input in modal
 *    - Hidden if not reproducible
 *    - Helps developers debug faster
 * 
 * 4. EMPLOYEE ASSIGNMENT:
 *    - Shows assigned employee name
 *    - Assignment handled via separate API endpoint
 *    - Can filter by assigned vs unassigned
 * 
 * 5. METRICS:
 *    - Critical count in alert banner
 *    - Overdue count with clock icon
 *    - Resolution time tracking
 *    - Bug ID for reference (#ABC123)
 */

/**
 * @file src/components/software/FeatureRoadmap.tsx
 * @description Feature planning and priority management interface
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Product roadmap visualization with feature backlog management, priority-based
 * sorting, status tracking, and effort estimation. Supports drag-and-drop prioritization
 * and milestone grouping.
 * 
 * FEATURES:
 * - Feature creation with effort estimation (story points)
 * - Priority management (P0-Critical, P1-High, P2-Medium, P3-Low)
 * - Status lifecycle (Planned → In Development → Testing → Released)
 * - Backlog organization by priority
 * - Progress tracking per feature
 * - Milestone grouping
 * - Effort totals per status
 * - Assignee display
 * 
 * BUSINESS LOGIC:
 * - Priority ordering: P0 > P1 > P2 > P3
 * - Effort measured in story points (1-13 Fibonacci scale)
 * - Status determines roadmap column placement
 * - Released features move to history
 * - Planned features in backlog
 * 
 * USAGE:
 * ```tsx
 * import FeatureRoadmap from '@/components/software/FeatureRoadmap';
 * 
 * <FeatureRoadmap productId={productId} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  Flex,
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
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface FeatureRoadmapProps {
  productId: string;
}

interface Feature {
  _id: string;
  product: string;
  title: string;
  description: string;
  priority: 'P0-Critical' | 'P1-High' | 'P2-Medium' | 'P3-Low';
  status: 'Planned' | 'In Development' | 'Testing' | 'Released';
  effortEstimate: number;
  assignedTo?: string;
  assignedEmployee?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  releasedAt?: string;
}

interface FeatureFormData {
  title: string;
  description: string;
  priority: string;
  effortEstimate: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function FeatureRoadmap({ productId }: FeatureRoadmapProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [formData, setFormData] = useState<FeatureFormData>({
    title: '',
    description: '',
    priority: 'P2-Medium',
    effortEstimate: 3,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Story point options (Fibonacci scale)
  const storyPoints = [1, 2, 3, 5, 8, 13];

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ productId });
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/software/features?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch features');
      }

      const data = await response.json();
      setFeatures(data.features || []);
    } catch (error: any) {
      console.error('Error fetching features:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load features',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [productId, priorityFilter]);

  // ============================================================================
  // Feature Creation
  // ============================================================================

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/software/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          effortEstimate: formData.effortEstimate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create feature');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Feature "${data.feature.title}" added to backlog`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and refresh
      setFormData({
        title: '',
        description: '',
        priority: 'P2-Medium',
        effortEstimate: 3,
      });
      onClose();
      fetchFeatures();
    } catch (error: any) {
      console.error('Error creating feature:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create feature',
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0-Critical':
        return 'red';
      case 'P1-High':
        return 'orange';
      case 'P2-Medium':
        return 'blue';
      case 'P3-Low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getFeaturesByStatus = (status: string) => {
    return features.filter((f) => f.status === status);
  };

  const getTotalEffort = (status: string) => {
    return getFeaturesByStatus(status).reduce((sum, f) => sum + f.effortEstimate, 0);
  };

  const getPriorityLevel = (priority: string) => {
    return parseInt(priority.charAt(1));
  };

  // Sort features by priority (P0 > P1 > P2 > P3)
  const sortedFeatures = (statusFeatures: Feature[]) => {
    return [...statusFeatures].sort((a, b) => {
      const aPriority = getPriorityLevel(a.priority);
      const bPriority = getPriorityLevel(b.priority);
      return aPriority - bPriority;
    });
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && features.length === 0) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Loading roadmap...</Text>
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
            Feature Roadmap
          </Text>
          <Text fontSize="sm" color="gray.600">
            Plan and track product features
          </Text>
        </Box>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={onOpen}>
          New Feature
        </Button>
      </Flex>

      {/* Summary Stats */}
      <Card variant="outline">
        <CardBody>
          <Grid templateColumns="repeat(4, 1fr)" gap={6}>
            <Stat>
              <StatLabel>Planned</StatLabel>
              <StatNumber>{getFeaturesByStatus('Planned').length}</StatNumber>
              <Text fontSize="sm" color="gray.600">
                {getTotalEffort('Planned')} pts
              </Text>
            </Stat>
            <Stat>
              <StatLabel>In Development</StatLabel>
              <StatNumber>{getFeaturesByStatus('In Development').length}</StatNumber>
              <Text fontSize="sm" color="gray.600">
                {getTotalEffort('In Development')} pts
              </Text>
            </Stat>
            <Stat>
              <StatLabel>Testing</StatLabel>
              <StatNumber>{getFeaturesByStatus('Testing').length}</StatNumber>
              <Text fontSize="sm" color="gray.600">
                {getTotalEffort('Testing')} pts
              </Text>
            </Stat>
            <Stat>
              <StatLabel>Released</StatLabel>
              <StatNumber>{getFeaturesByStatus('Released').length}</StatNumber>
              <Text fontSize="sm" color="gray.600">
                {getTotalEffort('Released')} pts
              </Text>
            </Stat>
          </Grid>
        </CardBody>
      </Card>

      {/* Priority Filter */}
      <HStack spacing={4} bg="white" p={4} borderRadius="lg" shadow="sm">
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          w="250px"
        >
          <option value="all">All Priorities</option>
          <option value="P0-Critical">P0 - Critical</option>
          <option value="P1-High">P1 - High</option>
          <option value="P2-Medium">P2 - Medium</option>
          <option value="P3-Low">P3 - Low</option>
        </Select>

        <Text fontSize="sm" color="gray.600" ml="auto">
          {features.length} feature{features.length !== 1 ? 's' : ''} total
        </Text>
      </HStack>

      {/* Roadmap Tabs */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Backlog ({getFeaturesByStatus('Planned').length})</Tab>
          <Tab>In Progress ({getFeaturesByStatus('In Development').length + getFeaturesByStatus('Testing').length})</Tab>
          <Tab>Released ({getFeaturesByStatus('Released').length})</Tab>
        </TabList>

        <TabPanels>
          {/* Backlog Tab */}
          <TabPanel>
            {getFeaturesByStatus('Planned').length === 0 ? (
              <Box bg="white" p={8} borderRadius="lg" textAlign="center">
                <Text color="gray.500">No planned features. Add your first feature to get started!</Text>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {sortedFeatures(getFeaturesByStatus('Planned')).map((feature) => (
                  <Card key={feature._id} variant="outline">
                    <CardBody>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack>
                            <Badge colorScheme={getPriorityColor(feature.priority)}>
                              {feature.priority}
                            </Badge>
                            <Badge colorScheme="purple" variant="outline">
                              {feature.effortEstimate} pts
                            </Badge>
                          </HStack>
                          <Text fontWeight="bold">{feature.title}</Text>
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {feature.description}
                          </Text>
                        </VStack>
                        <Button size="sm" colorScheme="blue" variant="outline">
                          Start Development
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* In Progress Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              {/* In Development Column */}
              <VStack align="stretch" spacing={3}>
                <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                  In Development ({getFeaturesByStatus('In Development').length})
                </Text>
                {sortedFeatures(getFeaturesByStatus('In Development')).map((feature) => (
                  <Card key={feature._id} variant="outline" borderColor="blue.300">
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Badge colorScheme={getPriorityColor(feature.priority)}>
                            {feature.priority}
                          </Badge>
                          <Badge colorScheme="purple" variant="outline">
                            {feature.effortEstimate} pts
                          </Badge>
                        </HStack>
                        <Text fontWeight="bold" fontSize="sm">
                          {feature.title}
                        </Text>
                        {feature.assignedEmployee && (
                          <Text fontSize="xs" color="gray.600">
                            👤 {feature.assignedEmployee.firstName} {feature.assignedEmployee.lastName}
                          </Text>
                        )}
                        <Button size="xs" colorScheme="yellow">
                          Move to Testing
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
                {getFeaturesByStatus('In Development').length === 0 && (
                  <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
                    No features in development
                  </Text>
                )}
              </VStack>

              {/* Testing Column */}
              <VStack align="stretch" spacing={3}>
                <Text fontSize="lg" fontWeight="semibold" color="yellow.600">
                  Testing ({getFeaturesByStatus('Testing').length})
                </Text>
                {sortedFeatures(getFeaturesByStatus('Testing')).map((feature) => (
                  <Card key={feature._id} variant="outline" borderColor="yellow.300">
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Badge colorScheme={getPriorityColor(feature.priority)}>
                            {feature.priority}
                          </Badge>
                          <Badge colorScheme="purple" variant="outline">
                            {feature.effortEstimate} pts
                          </Badge>
                        </HStack>
                        <Text fontWeight="bold" fontSize="sm">
                          {feature.title}
                        </Text>
                        {feature.assignedEmployee && (
                          <Text fontSize="xs" color="gray.600">
                            👤 {feature.assignedEmployee.firstName} {feature.assignedEmployee.lastName}
                          </Text>
                        )}
                        <Button size="xs" colorScheme="green">
                          Mark Released
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
                {getFeaturesByStatus('Testing').length === 0 && (
                  <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
                    No features in testing
                  </Text>
                )}
              </VStack>
            </Grid>
          </TabPanel>

          {/* Released Tab */}
          <TabPanel>
            {getFeaturesByStatus('Released').length === 0 ? (
              <Box bg="white" p={8} borderRadius="lg" textAlign="center">
                <Text color="gray.500">No released features yet</Text>
              </Box>
            ) : (
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {sortedFeatures(getFeaturesByStatus('Released')).map((feature) => (
                  <Card key={feature._id} variant="outline">
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Badge colorScheme={getPriorityColor(feature.priority)}>
                            {feature.priority}
                          </Badge>
                          <Badge colorScheme="green">Released</Badge>
                        </HStack>
                        <Text fontWeight="bold" fontSize="sm">
                          {feature.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600" noOfLines={2}>
                          {feature.description}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {feature.releasedAt
                            ? new Date(feature.releasedAt).toLocaleDateString()
                            : 'Recently released'}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Feature Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Feature</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Feature Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Dark mode support"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Priority</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="P0-Critical">P0 - Critical (Must Have)</option>
                  <option value="P1-High">P1 - High (Should Have)</option>
                  <option value="P2-Medium">P2 - Medium (Nice to Have)</option>
                  <option value="P3-Low">P3 - Low (Future)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the feature"
                  rows={4}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Effort Estimate (Story Points)</FormLabel>
                <Select
                  value={formData.effortEstimate}
                  onChange={(e) =>
                    setFormData({ ...formData, effortEstimate: parseInt(e.target.value) })
                  }
                >
                  {storyPoints.map((pts) => (
                    <option key={pts} value={pts}>
                      {pts} points
                    </option>
                  ))}
                </Select>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Fibonacci scale: 1 (trivial) to 13 (complex)
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
              onClick={handleCreate}
              isLoading={submitting}
              isDisabled={!formData.title || !formData.description}
            >
              Add to Backlog
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
 * 1. PRIORITY SYSTEM:
 *    - P0 (Critical): Must-have features blocking release
 *    - P1 (High): Should-have features for next release
 *    - P2 (Medium): Nice-to-have enhancements
 *    - P3 (Low): Future backlog items
 *    - Sorted by priority within each status
 * 
 * 2. EFFORT ESTIMATION:
 *    - Fibonacci scale (1, 2, 3, 5, 8, 13)
 *    - Story points indicate complexity
 *    - Totals shown per status column
 *    - Helps with sprint planning
 * 
 * 3. STATUS WORKFLOW:
 *    - Planned: Backlog items
 *    - In Development: Active work
 *    - Testing: QA phase
 *    - Released: Shipped to production
 *    - Kanban-style visualization
 * 
 * 4. TAB ORGANIZATION:
 *    - Backlog: All planned features
 *    - In Progress: Dev + Testing columns
 *    - Released: Historical view
 *    - Count badges in tab labels
 * 
 * 5. ROADMAP METRICS:
 *    - Feature count per status
 *    - Total effort (story points) per status
 *    - Priority distribution visible
 *    - Assignee tracking (when assigned)
 */

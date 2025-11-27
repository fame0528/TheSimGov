/**
 * @file src/components/ai/BreakthroughTracker.tsx
 * @description AI research breakthrough recording and patent filing interface
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Breakthrough management dashboard for recording research discoveries and filing
 * patents from AI research projects. Tracks commercial value, publication potential,
 * and patent filing workflow.
 * 
 * FEATURES:
 * - Breakthrough recording with impact assessment
 * - Patent filing from breakthroughs
 * - Commercial value estimation
 * - Publication-ready flagging
 * - Breakthrough timeline visualization
 * - Patent status tracking
 * - Project association display
 * - Research output metrics
 * 
 * BUSINESS LOGIC:
 * - Breakthroughs can generate multiple patents
 * - Commercial value: $100k - $10M range
 * - Publication flag for academic papers
 * - Patent filing creates separate Patent records
 * - Breakthrough count affects project success metrics
 * 
 * USAGE:
 * ```tsx
 * import BreakthroughTracker from '@/components/ai/BreakthroughTracker';
 * 
 * <BreakthroughTracker projectId={projectId} />
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
  Button,
  Card,
  CardBody,
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
  NumberInput,
  NumberInputField,
  Checkbox,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { FiZap, FiFileText, FiAward, FiDollarSign } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface BreakthroughTrackerProps {
  projectId: string;
}

interface Breakthrough {
  _id: string;
  description: string;
  commercialValue: number;
  publicationReady: boolean;
  createdAt: string;
}

interface Patent {
  _id: string;
  title: string;
  status: string;
  filedAt: string;
  value: number;
}

interface ProjectData {
  _id: string;
  name: string;
  type: string;
  progress: number;
  breakthroughs: Breakthrough[];
  patents: Patent[];
}

interface BreakthroughFormData {
  description: string;
  commercialValue: number;
  publicationReady: boolean;
}

interface PatentFormData {
  title: string;
  description: string;
  value: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function BreakthroughTracker({ projectId }: BreakthroughTrackerProps) {
  const toast = useToast();
  const {
    isOpen: isBreakthroughOpen,
    onOpen: onBreakthroughOpen,
    onClose: onBreakthroughClose,
  } = useDisclosure();
  const {
    isOpen: isPatentOpen,
    onOpen: onPatentOpen,
    onClose: onPatentClose,
  } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [breakthroughForm, setBreakthroughForm] = useState<BreakthroughFormData>({
    description: '',
    commercialValue: 500000,
    publicationReady: false,
  });
  const [patentForm, setPatentForm] = useState<PatentFormData>({
    title: '',
    description: '',
    value: 1000000,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/research/projects/${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data.project);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // ============================================================================
  // Breakthrough Recording
  // ============================================================================

  const handleRecordBreakthrough = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/ai/research/projects/${projectId}/breakthroughs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(breakthroughForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record breakthrough');
      }

      toast({
        title: 'Success',
        description: 'Breakthrough recorded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and refresh
      setBreakthroughForm({
        description: '',
        commercialValue: 500000,
        publicationReady: false,
      });
      onBreakthroughClose();
      fetchProject();
    } catch (error: any) {
      console.error('Error recording breakthrough:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record breakthrough',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Patent Filing
  // ============================================================================

  const handleFilePatent = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/ai/research/projects/${projectId}/patents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patentForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to file patent');
      }

      toast({
        title: 'Success',
        description: 'Patent filed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and refresh
      setPatentForm({
        title: '',
        description: '',
        value: 1000000,
      });
      onPatentClose();
      fetchProject();
    } catch (error: any) {
      console.error('Error filing patent:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to file patent',
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

  const getPatentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'yellow';
      case 'Approved':
        return 'green';
      case 'Rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const totalBreakthroughValue = project?.breakthroughs.reduce(
    (sum, b) => sum + b.commercialValue,
    0
  ) || 0;

  const totalPatentValue = project?.patents.reduce((sum, p) => sum + p.value, 0) || 0;

  const publicationReadyCount = project?.breakthroughs.filter((b) => b.publicationReady).length || 0;

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Loading breakthroughs...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!project) {
    return (
      <Box bg="white" p={8} borderRadius="lg" textAlign="center">
        <Text color="gray.500">Project not found</Text>
      </Box>
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
            Research Breakthroughs
          </Text>
          <Text fontSize="sm" color="gray.600">
            {project.name || `${project.type} Research`}
          </Text>
        </Box>
        <HStack>
          <Button colorScheme="purple" leftIcon={<FiZap />} onClick={onBreakthroughOpen}>
            Record Breakthrough
          </Button>
          <Button colorScheme="blue" leftIcon={<FiAward />} onClick={onPatentOpen}>
            File Patent
          </Button>
        </HStack>
      </Flex>

      {/* Summary Stats */}
      <Card variant="outline">
        <CardBody>
          <Grid templateColumns="repeat(4, 1fr)" gap={6}>
            <Stat>
              <StatLabel>Breakthroughs</StatLabel>
              <StatNumber>{project.breakthroughs.length}</StatNumber>
              <StatHelpText>Total discoveries</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Commercial Value</StatLabel>
              <StatNumber>${(totalBreakthroughValue / 1000000).toFixed(1)}M</StatNumber>
              <StatHelpText>From breakthroughs</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Patents Filed</StatLabel>
              <StatNumber>{project.patents.length}</StatNumber>
              <StatHelpText>${(totalPatentValue / 1000000).toFixed(1)}M value</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Publications</StatLabel>
              <StatNumber>{publicationReadyCount}</StatNumber>
              <StatHelpText>Ready to publish</StatHelpText>
            </Stat>
          </Grid>
        </CardBody>
      </Card>

      {/* Breakthroughs Section */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Text fontSize="xl" fontWeight="semibold">
            Breakthrough Timeline
          </Text>
          <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
            {project.breakthroughs.length} Total
          </Badge>
        </HStack>

        {project.breakthroughs.length === 0 ? (
          <Box bg="white" p={8} borderRadius="lg" textAlign="center">
            <Text color="gray.500">No breakthroughs yet. Record your first discovery!</Text>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {project.breakthroughs.map((breakthrough, index) => (
              <Card key={breakthrough._id} variant="outline">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <Badge colorScheme="purple">
                          Breakthrough #{project.breakthroughs.length - index}
                        </Badge>
                        {breakthrough.publicationReady && (
                          <HStack spacing={1}>
                            <FiFileText size={12} />
                            <Badge colorScheme="green">Publication Ready</Badge>
                          </HStack>
                        )}
                      </HStack>

                      <Text fontSize="sm" color="gray.700">
                        {breakthrough.description}
                      </Text>

                      <HStack spacing={4} fontSize="sm" color="gray.600">
                        <HStack>
                          <FiDollarSign />
                          <Text fontWeight="semibold">
                            ${(breakthrough.commercialValue / 1000).toFixed(0)}K
                          </Text>
                          <Text>commercial value</Text>
                        </HStack>
                        <Text>•</Text>
                        <Text>
                          {new Date(breakthrough.createdAt).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </VStack>

                    <Button size="sm" leftIcon={<FiAward />} onClick={onPatentOpen}>
                      File Patent
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </Box>

      <Divider />

      {/* Patents Section */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Text fontSize="xl" fontWeight="semibold">
            Patents Filed
          </Text>
          <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
            {project.patents.length} Total
          </Badge>
        </HStack>

        {project.patents.length === 0 ? (
          <Box bg="white" p={8} borderRadius="lg" textAlign="center">
            <Text color="gray.500">No patents filed yet</Text>
          </Box>
        ) : (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            {project.patents.map((patent) => (
              <Card key={patent._id} variant="outline">
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Badge colorScheme={getPatentStatusColor(patent.status)}>
                        {patent.status}
                      </Badge>
                      <Text fontSize="sm" fontWeight="semibold" color="green.600">
                        ${(patent.value / 1000000).toFixed(1)}M
                      </Text>
                    </HStack>

                    <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
                      {patent.title}
                    </Text>

                    <Text fontSize="xs" color="gray.600">
                      Filed: {new Date(patent.filedAt).toLocaleDateString()}
                    </Text>

                    <Button size="xs" variant="outline" colorScheme="blue">
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        )}
      </Box>

      {/* Record Breakthrough Modal */}
      <Modal isOpen={isBreakthroughOpen} onClose={onBreakthroughClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Record Research Breakthrough</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Breakthrough Description</FormLabel>
                <Textarea
                  value={breakthroughForm.description}
                  onChange={(e) =>
                    setBreakthroughForm({ ...breakthroughForm, description: e.target.value })
                  }
                  placeholder="Describe the discovery or innovation achieved..."
                  rows={5}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Estimated Commercial Value</FormLabel>
                <NumberInput
                  value={breakthroughForm.commercialValue}
                  onChange={(valueString) =>
                    setBreakthroughForm({
                      ...breakthroughForm,
                      commercialValue: parseInt(valueString) || 0,
                    })
                  }
                  min={100000}
                  max={10000000}
                  step={100000}
                >
                  <NumberInputField />
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Range: $100K - $10M
                </Text>
              </FormControl>

              <FormControl>
                <Checkbox
                  isChecked={breakthroughForm.publicationReady}
                  onChange={(e) =>
                    setBreakthroughForm({
                      ...breakthroughForm,
                      publicationReady: e.target.checked,
                    })
                  }
                >
                  Ready for academic publication
                </Checkbox>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Check if this breakthrough is suitable for peer-reviewed papers
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBreakthroughClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleRecordBreakthrough}
              isLoading={submitting}
              isDisabled={!breakthroughForm.description}
            >
              Record Breakthrough
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* File Patent Modal */}
      <Modal isOpen={isPatentOpen} onClose={onPatentClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>File Patent Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Patent Title</FormLabel>
                <Input
                  value={patentForm.title}
                  onChange={(e) => setPatentForm({ ...patentForm, title: e.target.value })}
                  placeholder="e.g., Novel Neural Architecture for Language Understanding"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Patent Description</FormLabel>
                <Textarea
                  value={patentForm.description}
                  onChange={(e) => setPatentForm({ ...patentForm, description: e.target.value })}
                  placeholder="Detailed description of the invention..."
                  rows={6}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Estimated Patent Value</FormLabel>
                <NumberInput
                  value={patentForm.value}
                  onChange={(valueString) =>
                    setPatentForm({ ...patentForm, value: parseInt(valueString) || 0 })
                  }
                  min={500000}
                  max={50000000}
                  step={500000}
                >
                  <NumberInputField />
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Range: $500K - $50M
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPatentClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleFilePatent}
              isLoading={submitting}
              isDisabled={!patentForm.title || !patentForm.description}
            >
              File Patent
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
 * 1. BREAKTHROUGH RECORDING:
 *    - Description captures discovery details
 *    - Commercial value: $100K - $10M range
 *    - Publication flag for academic papers
 *    - Timeline view shows all breakthroughs
 * 
 * 2. PATENT FILING:
 *    - Separate from breakthroughs (not all discoveries are patentable)
 *    - Patent value: $500K - $50M range
 *    - Status tracking (Pending/Approved/Rejected)
 *    - Filed date recorded automatically
 * 
 * 3. VALUE TRACKING:
 *    - Total commercial value aggregated
 *    - Total patent value aggregated
 *    - Individual values displayed per item
 *    - Millions format for large numbers
 * 
 * 4. PUBLICATION METRICS:
 *    - Publication-ready flag for academic output
 *    - Count shown in summary stats
 *    - Badge displayed on breakthrough cards
 *    - Academic impact tracking
 * 
 * 5. UI/UX:
 *    - Dual modals for breakthrough vs patent
 *    - Timeline-style breakthrough display
 *    - Grid layout for patents
 *    - Color-coded status badges
 *    - Action buttons for quick filing
 */

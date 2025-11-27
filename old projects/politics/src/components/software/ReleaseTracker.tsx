/**
 * @file src/components/software/ReleaseTracker.tsx
 * @description Software release management and version tracking interface
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Release management dashboard for tracking software versions, changelogs, downloads,
 * and release history. Supports semver versioning, release type categorization, and
 * download metrics tracking.
 * 
 * FEATURES:
 * - Release creation with changelog and feature/bug linking
 * - Release history with version timeline
 * - Download tracking and metrics
 * - Release type badges (Major, Minor, Patch, Hotfix)
 * - Latest version highlighting
 * - Stability score calculation
 * - Feature and bug fix lists
 * - Known issues display
 * 
 * BUSINESS LOGIC:
 * - Semver validation (X.Y.Z format)
 * - Release types: Major (breaking), Minor (features), Patch (fixes), Hotfix (urgent)
 * - Latest release automatically determined by version comparison
 * - Stability score: 100 - (bugs × 10) + (downloads × 0.01)
 * - Download increments tracked per release
 * 
 * USAGE:
 * ```tsx
 * import ReleaseTracker from '@/components/software/ReleaseTracker';
 * 
 * <ReleaseTracker productId={productId} />
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
  ListIcon,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface ReleaseTrackerProps {
  productId: string;
}

interface SoftwareRelease {
  _id: string;
  product: string;
  version: string;
  releaseType: 'Major' | 'Minor' | 'Patch' | 'Hotfix';
  releaseDate: string;
  changelog: string;
  features: string[];
  bugFixes: string[];
  knownIssues: string[];
  downloadCount: number;
  status: 'Planned' | 'Beta' | 'Stable' | 'Deprecated';
}

interface ReleaseFormData {
  version: string;
  releaseType: string;
  changelog: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ReleaseTracker({ productId }: ReleaseTrackerProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [releases, setReleases] = useState<SoftwareRelease[]>([]);
  const [formData, setFormData] = useState<ReleaseFormData>({
    version: '',
    releaseType: 'Minor',
    changelog: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/software/releases?productId=${productId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }

      const data = await response.json();
      setReleases(data.releases || []);
    } catch (error: any) {
      console.error('Error fetching releases:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load releases',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, [productId]);

  // ============================================================================
  // Release Creation
  // ============================================================================

  const handleCreate = async () => {
    // Validate semver format
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(formData.version)) {
      toast({
        title: 'Invalid Version',
        description: 'Version must follow semantic versioning (e.g., 2.1.0)',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/software/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productId,
          version: formData.version,
          releaseType: formData.releaseType,
          changelog: formData.changelog,
          features: [],
          bugFixes: [],
          knownIssues: [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create release');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Release v${data.release.version} created successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and refresh
      setFormData({
        version: '',
        releaseType: 'Minor',
        changelog: '',
      });
      onClose();
      fetchReleases();
    } catch (error: any) {
      console.error('Error creating release:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create release',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Download Tracking
  // ============================================================================

  const handleDownloadIncrement = async (releaseId: string) => {
    try {
      const response = await fetch(`/api/software/releases/${releaseId}/downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to track download');
      }

      toast({
        title: 'Download Tracked',
        description: 'Download count updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      fetchReleases();
    } catch (error: any) {
      console.error('Error tracking download:', error);
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getReleaseTypeColor = (type: string) => {
    switch (type) {
      case 'Major':
        return 'red';
      case 'Minor':
        return 'blue';
      case 'Patch':
        return 'green';
      case 'Hotfix':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stable':
        return 'green';
      case 'Beta':
        return 'yellow';
      case 'Planned':
        return 'purple';
      case 'Deprecated':
        return 'red';
      default:
        return 'gray';
    }
  };

  const isLatest = (release: SoftwareRelease) => {
    if (releases.length === 0) return false;
    const sortedReleases = [...releases].sort((a, b) => b.version.localeCompare(a.version));
    return sortedReleases[0]._id === release._id;
  };

  const calculateStabilityScore = (release: SoftwareRelease) => {
    const bugPenalty = release.knownIssues.length * 10;
    const downloadBonus = release.downloadCount * 0.01;
    return Math.max(0, Math.min(100, 100 - bugPenalty + downloadBonus));
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading && releases.length === 0) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Loading releases...</Text>
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
            Release History
          </Text>
          <Text fontSize="sm" color="gray.600">
            Track versions, downloads, and changelogs
          </Text>
        </Box>
        <Button colorScheme="blue" onClick={onOpen}>
          Create Release
        </Button>
      </Flex>

      {/* Summary Stats */}
      {releases.length > 0 && (
        <Card variant="outline">
          <CardBody>
            <HStack spacing={8} justify="space-around">
              <Stat>
                <StatLabel>Total Releases</StatLabel>
                <StatNumber>{releases.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Latest Version</StatLabel>
                <StatNumber>{releases[0]?.version || 'N/A'}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Downloads</StatLabel>
                <StatNumber>
                  {releases.reduce((sum, r) => sum + r.downloadCount, 0).toLocaleString()}
                </StatNumber>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Releases List */}
      {releases.length === 0 ? (
        <Box bg="white" p={8} borderRadius="lg" textAlign="center">
          <Text color="gray.500">No releases yet. Create your first release to get started!</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {releases.map((release) => (
            <Card
              key={release._id}
              variant="outline"
              borderWidth={isLatest(release) ? 2 : 1}
              borderColor={isLatest(release) ? 'blue.500' : 'gray.200'}
            >
              <CardHeader pb={2}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Text fontSize="2xl" fontWeight="bold">
                        v{release.version}
                      </Text>
                      {isLatest(release) && (
                        <Badge colorScheme="blue" fontSize="sm">
                          Latest
                        </Badge>
                      )}
                      <Badge colorScheme={getReleaseTypeColor(release.releaseType)}>
                        {release.releaseType}
                      </Badge>
                      <Badge colorScheme={getStatusColor(release.status)}>{release.status}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      Released {new Date(release.releaseDate).toLocaleDateString()}
                    </Text>
                  </VStack>

                  <VStack align="end" spacing={2}>
                    <HStack>
                      <Tooltip label="Track Download">
                        <IconButton
                          aria-label="Download"
                          icon={<FiDownload />}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadIncrement(release._id)}
                        />
                      </Tooltip>
                      <Badge fontSize="md" px={3} py={1}>
                        {release.downloadCount.toLocaleString()} downloads
                      </Badge>
                    </HStack>
                    <Box w="200px">
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Stability Score: {calculateStabilityScore(release).toFixed(0)}%
                      </Text>
                      <Progress
                        value={calculateStabilityScore(release)}
                        colorScheme={calculateStabilityScore(release) > 70 ? 'green' : 'yellow'}
                        size="sm"
                        borderRadius="full"
                      />
                    </Box>
                  </VStack>
                </HStack>
              </CardHeader>

              <CardBody pt={2}>
                <VStack align="stretch" spacing={4}>
                  {/* Changelog */}
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>
                      Changelog
                    </Text>
                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                      {release.changelog}
                    </Text>
                  </Box>

                  <Divider />

                  {/* Features and Bug Fixes */}
                  <HStack spacing={6} align="start">
                    {release.features.length > 0 && (
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>
                          New Features
                        </Text>
                        <List spacing={1}>
                          {release.features.slice(0, 3).map((feature, idx) => (
                            <ListItem key={idx} fontSize="sm">
                              <ListIcon as={FiCheckCircle} color="green.500" />
                              {feature}
                            </ListItem>
                          ))}
                          {release.features.length > 3 && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              +{release.features.length - 3} more features
                            </Text>
                          )}
                        </List>
                      </Box>
                    )}

                    {release.bugFixes.length > 0 && (
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>
                          Bug Fixes
                        </Text>
                        <List spacing={1}>
                          {release.bugFixes.slice(0, 3).map((fix, idx) => (
                            <ListItem key={idx} fontSize="sm">
                              <ListIcon as={FiCheckCircle} color="blue.500" />
                              {fix}
                            </ListItem>
                          ))}
                          {release.bugFixes.length > 3 && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              +{release.bugFixes.length - 3} more fixes
                            </Text>
                          )}
                        </List>
                      </Box>
                    )}
                  </HStack>

                  {/* Known Issues */}
                  {release.knownIssues.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={2} color="orange.600">
                          Known Issues
                        </Text>
                        <List spacing={1}>
                          {release.knownIssues.map((issue, idx) => (
                            <ListItem key={idx} fontSize="sm" color="gray.700">
                              <ListIcon as={FiAlertCircle} color="orange.500" />
                              {issue}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Create Release Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Release</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Version Number</FormLabel>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="2.1.0"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Must follow semantic versioning (X.Y.Z)
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Release Type</FormLabel>
                <Select
                  value={formData.releaseType}
                  onChange={(e) => setFormData({ ...formData, releaseType: e.target.value })}
                >
                  <option value="Major">Major (Breaking Changes)</option>
                  <option value="Minor">Minor (New Features)</option>
                  <option value="Patch">Patch (Bug Fixes)</option>
                  <option value="Hotfix">Hotfix (Urgent Fix)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Changelog</FormLabel>
                <Textarea
                  value={formData.changelog}
                  onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                  placeholder="Describe what's new in this release..."
                  rows={6}
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
              isDisabled={!formData.version || !formData.changelog}
            >
              Create Release
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
 * 1. VERSION MANAGEMENT:
 *    - Semver validation enforced (X.Y.Z format)
 *    - Latest version highlighted with blue border
 *    - Version comparison for "Latest" badge
 *    - Release type color coding (Major/Minor/Patch/Hotfix)
 * 
 * 2. DOWNLOAD TRACKING:
 *    - Download button increments count via API
 *    - Total downloads across all releases shown
 *    - Per-release download metrics displayed
 *    - Toast notification on successful tracking
 * 
 * 3. STABILITY SCORING:
 *    - Formula: 100 - (knownIssues × 10) + (downloads × 0.01)
 *    - Range: 0-100, capped at boundaries
 *    - Visual progress bar with color coding
 *    - Green (>70%), Yellow (≤70%)
 * 
 * 4. CHANGELOG DISPLAY:
 *    - Pre-wrapped text preserves formatting
 *    - Features list with checkmark icons
 *    - Bug fixes list with blue checkmarks
 *    - Known issues with alert icons
 * 
 * 5. UI/UX:
 *    - Summary stats card at top
 *    - Chronological release timeline
 *    - Expandable feature/fix lists (show 3, then count)
 *    - Responsive layout with proper spacing
 */

/**
 * @file src/components/media/PlatformManager.tsx
 * @description Multi-platform distribution dashboard with cross-posting automation
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Platform management dashboard for media content distribution across multiple channels
 * (YouTube, TikTok, Blog, Podcast, Twitter, Instagram). Displays platform-specific
 * performance metrics, cross-platform analytics comparison, algorithm score tracking,
 * monetization tier status, and cross-posting automation setup. Enables creators to
 * optimize distribution strategy and maximize reach across all active platforms.
 * 
 * COMPONENT ARCHITECTURE:
 * - Platform cards: Name, type, status, performance metrics, monetization tier
 * - Performance comparison: Views, engagement, revenue across platforms
 * - Algorithm scoring: Platform-specific algorithm boost tracking
 * - Monetization tiers: None/Partner/Premium/Elite with CPM multipliers
 * - Auto-publish settings: Toggle automatic content distribution
 * - Platform creation modal: Add new distribution channels
 * 
 * STATE MANAGEMENT:
 * - platforms: Array of Platform documents
 * - loading: Loading state during fetch
 * - selectedPlatform: Platform ID for detailed view
 * - isCreating: Modal state for new platform creation
 * 
 * API INTEGRATION:
 * - GET /api/media/platforms - Fetch all platforms
 * - POST /api/media/platforms - Create new platform
 * - PATCH /api/media/platforms/[id] - Update platform settings
 * - DELETE /api/media/platforms/[id] - Remove platform
 * - GET /api/media/platforms/analytics - Cross-platform analytics
 * 
 * PROPS:
 * - companyId: Company ID for platform filtering
 * - onPlatformSelect?: Callback when platform selected for detailed view
 * 
 * USAGE:
 * ```tsx
 * <PlatformManager
 *   companyId="64f7a1b2c3d4e5f6g7h8i9j0"
 *   onPlatformSelect={(id) => router.push(`/platforms/${id}`)}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Algorithm boost ranges: 1.0 (default) to 10.0 (viral)
 * - Monetization tiers affect CPM: None (0x), Partner (1x), Premium (2x), Elite (3x)
 * - Auto-publish distributes new content automatically to selected platforms
 * - Platform types: YouTube, TikTok, Blog, Podcast, Twitter, Instagram
 * - Performance metrics calculated across all distributed content
 * - Cross-platform comparison helps identify best-performing channels
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  useToast,
  useDisclosure,
  Skeleton,
  Switch,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
} from '@chakra-ui/react';
import { FiPlus, FiMoreVertical, FiTrash2, FiSettings, FiTrendingUp } from 'react-icons/fi';

/**
 * Platform type enum
 */
type PlatformType = 'YouTube' | 'TikTok' | 'Blog' | 'Podcast' | 'Twitter' | 'Instagram';

/**
 * Monetization tier enum
 */
type MonetizationTier = 'None' | 'Partner' | 'Premium' | 'Elite';

/**
 * Platform interface (from backend)
 */
interface Platform {
  _id: string;
  company: string;
  name: string;
  platformType: PlatformType;
  isActive: boolean;
  
  // Performance
  totalViews: number;
  totalEngagement: number;
  totalRevenue: number;
  
  // Algorithm
  algorithmScore: number;
  reachMultiplier: number;
  
  // Monetization
  monetizationTier: MonetizationTier;
  cpmMultiplier: number;
  
  // Settings
  autoPublish: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Platform form data interface
 */
interface PlatformFormData {
  name: string;
  platformType: PlatformType;
  autoPublish: boolean;
}

/**
 * PlatformManager component props
 */
interface PlatformManagerProps {
  companyId: string;
  onPlatformSelect?: (platformId: string) => void;
}

/**
 * PlatformManager component
 * 
 * @description
 * Multi-platform distribution dashboard with performance tracking and automation
 * 
 * @param {PlatformManagerProps} props - Component props
 * @returns {JSX.Element} PlatformManager dashboard
 */
export default function PlatformManager({
  companyId,
  onPlatformSelect,
}: PlatformManagerProps): JSX.Element {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Platforms state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<PlatformFormData>({
    name: '',
    platformType: 'YouTube',
    autoPublish: false,
  });

  /**
   * Fetch platforms from API
   */
  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media/platforms?companyId=${companyId}`);
      const data = await response.json();

      if (data.success) {
        setPlatforms(data.platforms || []);
      } else {
        toast({
          title: 'Failed to load platforms',
          description: data.error || 'Could not fetch platforms',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading platforms',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch platforms on mount
   */
  useEffect(() => {
    fetchPlatforms();
  }, [companyId]);

  /**
   * Handle platform creation
   */
  const handleCreatePlatform = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a platform name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/media/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Platform created',
          description: `${formData.name} added successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Reset form
        setFormData({
          name: '',
          platformType: 'YouTube',
          autoPublish: false,
        });

        // Close modal and refetch
        onClose();
        fetchPlatforms();
      } else {
        toast({
          title: 'Failed to create platform',
          description: data.error || 'Something went wrong',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating platform',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle platform deletion
   */
  const handleDelete = async (platformId: string, platformName: string) => {
    if (!window.confirm(`Delete ${platformName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/media/platforms/${platformId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Platform deleted',
          description: `${platformName} removed successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Refetch platforms
        fetchPlatforms();
      } else {
        toast({
          title: 'Failed to delete',
          description: data.error || 'Could not delete platform',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error deleting platform',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  /**
   * Get monetization badge color
   */
  const getMonetizationBadgeColor = (tier: MonetizationTier): string => {
    switch (tier) {
      case 'Elite':
        return 'purple';
      case 'Premium':
        return 'green';
      case 'Partner':
        return 'blue';
      default:
        return 'gray';
    }
  };

  /**
   * Get platform type badge color
   */
  const getPlatformBadgeColor = (type: PlatformType): string => {
    switch (type) {
      case 'YouTube':
        return 'red';
      case 'TikTok':
        return 'pink';
      case 'Blog':
        return 'blue';
      case 'Podcast':
        return 'purple';
      case 'Twitter':
        return 'cyan';
      case 'Instagram':
        return 'orange';
      default:
        return 'gray';
    }
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton height="20px" width="70%" />
          </CardHeader>
          <CardBody>
            <Skeleton height="80px" />
          </CardBody>
        </Card>
      ))}
    </Grid>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <Box textAlign="center" py={10}>
      <Text fontSize="lg" color="gray.500" mb={2}>
        No platforms configured
      </Text>
      <Text fontSize="sm" color="gray.400" mb={4}>
        Add distribution channels to expand your reach
      </Text>
      <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
        Add Platform
      </Button>
    </Box>
  );

  /**
   * Render platform card
   */
  const renderPlatformCard = (platform: Platform) => (
    <Card key={platform._id} variant="outline" _hover={{ shadow: 'md' }}>
      <CardHeader pb={2}>
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme={getPlatformBadgeColor(platform.platformType)}>
            {platform.platformType}
          </Badge>
          <HStack spacing={1}>
            <Badge colorScheme={getMonetizationBadgeColor(platform.monetizationTier)}>
              {platform.monetizationTier}
            </Badge>
            {platform.isActive && (
              <Badge colorScheme="green" variant="solid">
                Active
              </Badge>
            )}
          </HStack>
        </HStack>

        <Heading size="sm" noOfLines={1}>
          {platform.name}
        </Heading>
      </CardHeader>

      <CardBody py={3}>
        <Grid templateColumns="repeat(2, 1fr)" gap={3} mb={3}>
          <Stat size="sm">
            <StatLabel fontSize="xs">Views</StatLabel>
            <StatNumber fontSize="md">
              {platform.totalViews.toLocaleString()}
            </StatNumber>
          </Stat>

          <Stat size="sm">
            <StatLabel fontSize="xs">Engagement</StatLabel>
            <StatNumber fontSize="md">
              {platform.totalEngagement.toLocaleString()}
            </StatNumber>
          </Stat>

          <Stat size="sm">
            <StatLabel fontSize="xs">Revenue</StatLabel>
            <StatNumber fontSize="md" color="green.500">
              ${Math.round(platform.totalRevenue).toLocaleString()}
            </StatNumber>
          </Stat>

          <Stat size="sm">
            <StatLabel fontSize="xs">CPM Multiplier</StatLabel>
            <StatNumber fontSize="md">{platform.cpmMultiplier.toFixed(1)}x</StatNumber>
          </Stat>
        </Grid>

        <Divider mb={3} />

        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" fontSize="sm">
            <Text color="gray.600">Algorithm Score:</Text>
            <Badge colorScheme={platform.algorithmScore >= 70 ? 'green' : 'gray'}>
              {platform.algorithmScore}/100
            </Badge>
          </HStack>

          <Progress
            value={platform.algorithmScore}
            colorScheme={platform.algorithmScore >= 70 ? 'green' : 'blue'}
            size="sm"
            borderRadius="md"
          />

          <HStack justify="space-between" fontSize="sm" mt={2}>
            <Text color="gray.600">Reach Multiplier:</Text>
            <HStack>
              <FiTrendingUp color={platform.reachMultiplier > 1 ? 'green' : 'gray'} />
              <Text fontWeight="medium">{platform.reachMultiplier.toFixed(1)}x</Text>
            </HStack>
          </HStack>

          <Divider />

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor={`auto-${platform._id}`} mb="0" fontSize="sm">
              Auto-publish
            </FormLabel>
            <Switch
              id={`auto-${platform._id}`}
              isChecked={platform.autoPublish}
              colorScheme="green"
              size="sm"
            />
          </FormControl>
        </VStack>
      </CardBody>

      <CardFooter pt={2}>
        <HStack justify="space-between" width="100%">
          <Text fontSize="xs" color="gray.500">
            {new Date(platform.createdAt).toLocaleDateString()}
          </Text>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem
                icon={<FiSettings />}
                onClick={() => onPlatformSelect?.(platform._id)}
              >
                Settings
              </MenuItem>
              <MenuItem
                icon={<FiTrash2 />}
                onClick={() => handleDelete(platform._id, platform.name)}
                color="red.500"
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </CardFooter>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="md">Distribution Platforms</Heading>
          <Text fontSize="sm" color="gray.600">
            {platforms.length} platform{platforms.length !== 1 ? 's' : ''} configured
          </Text>
        </VStack>

        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Add Platform
        </Button>
      </HStack>

      {/* Platforms Grid */}
      {loading ? (
        renderSkeletons()
      ) : platforms.length === 0 ? (
        renderEmptyState()
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {platforms.map(renderPlatformCard)}
        </Grid>
      )}

      {/* Create Platform Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Distribution Platform</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Platform Type</FormLabel>
                <Select
                  value={formData.platformType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      platformType: e.target.value as PlatformType,
                    })
                  }
                >
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Blog">Blog</option>
                  <option value="Podcast">Podcast</option>
                  <option value="Twitter">Twitter</option>
                  <option value="Instagram">Instagram</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Platform Name</FormLabel>
                <Input
                  placeholder="e.g., My YouTube Channel"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  maxLength={100}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="auto-publish-new" mb="0">
                  Enable auto-publish
                </FormLabel>
                <Switch
                  id="auto-publish-new"
                  isChecked={formData.autoPublish}
                  onChange={(e) =>
                    setFormData({ ...formData, autoPublish: e.target.checked })
                  }
                  colorScheme="green"
                />
              </FormControl>

              <Box bg="blue.50" p={3} borderRadius="md">
                <Text fontSize="sm" color="blue.800">
                  Auto-publish will automatically distribute new content to this
                  platform when published.
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button
                colorScheme="blue"
                onClick={handleCreatePlatform}
                isLoading={isSubmitting}
                loadingText="Creating..."
              >
                Create Platform
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

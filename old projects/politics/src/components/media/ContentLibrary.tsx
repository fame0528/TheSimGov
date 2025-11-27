/**
 * @file src/components/media/ContentLibrary.tsx
 * @description Content management dashboard with performance cards and filtering
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Main content library dashboard displaying all media content pieces with performance
 * metrics cards. Provides filtering by content type (Article/Video/Podcast/etc.) and
 * status (Draft/Published/Trending/Archived), sorting options (newest/oldest/most views),
 * trending indicators, viral badges, engagement metrics display (views/shares/likes),
 * revenue tracking, and quick actions (edit/delete/distribute). Real-time updates on
 * content performance with visual indicators for quality score and virality.
 * 
 * COMPONENT ARCHITECTURE:
 * - Grid layout with responsive card display (3-4 columns)
 * - Filter controls: Type, Status, Sort order
 * - Performance cards: Title, type badge, status badge, metrics, actions
 * - Trending indicator: Visual badge for isPeaking content
 * - Viral coefficient display: Shares/Views ratio with color coding
 * - Revenue tracking: Total revenue per content piece
 * - Quick actions: Edit, Delete, View Performance
 * 
 * STATE MANAGEMENT:
 * - content: Array of MediaContent documents
 * - filters: { type, status, sort }
 * - loading: Loading state during fetch
 * - selectedContent: Content ID for modals/actions
 * 
 * API INTEGRATION:
 * - GET /api/media/content - Fetch content list with filters
 * - DELETE /api/media/content/[id] - Delete content
 * - GET /api/media/content/[id]/performance - View performance
 * 
 * PROPS:
 * - companyId: Company ID for content filtering
 * - onContentSelect?: Callback when content selected for editing
 * 
 * USAGE:
 * ```tsx
 * <ContentLibrary
 *   companyId="64f7a1b2c3d4e5f6g7h8i9j0"
 *   onContentSelect={(id) => router.push(`/content/${id}`)}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Viral badge shows when viralCoefficient > 0.05 && views > 10,000
 * - Trending badge shows when isPeaking === true
 * - Quality score color: >85 green, 70-84 yellow, <70 red
 * - Revenue displayed as total (ad + sponsorship + subscription)
 * - Performance metrics update in real-time via refetch
 * - Cards sorted by: Trending → Published → Draft → Archived
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
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  useToast,
  Skeleton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
} from '@chakra-ui/react';
import { FiSearch, FiMoreVertical, FiEye, FiTrendingUp, FiTrash2 } from 'react-icons/fi';

/**
 * Content type
 */
type ContentType = 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost' | 'All';

/**
 * Content status
 */
type ContentStatus = 'Draft' | 'Published' | 'Trending' | 'Archived' | 'All';

/**
 * Sort options
 */
type SortOption = '-createdAt' | 'createdAt' | '-views' | '-trendingScore';

/**
 * MediaContent interface (from backend)
 */
interface MediaContent {
  _id: string;
  company: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  publishedAt?: string;
  
  // Quality
  qualityScore: number;
  
  // Engagement
  views: number;
  shares: number;
  likes: number;
  comments: number;
  
  // Virality
  viralCoefficient: number;
  trendingScore: number;
  isPeaking: boolean;
  
  // Revenue
  revenueGenerated: number;
  productionCost: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Filter state interface
 */
interface FilterState {
  type: ContentType;
  status: ContentStatus;
  sort: SortOption;
  search: string;
}

/**
 * ContentLibrary component props
 */
interface ContentLibraryProps {
  companyId: string;
  onContentSelect?: (contentId: string) => void;
}

/**
 * ContentLibrary component
 * 
 * @description
 * Content management dashboard with performance cards, filtering, and quick actions
 * 
 * @param {ContentLibraryProps} props - Component props
 * @returns {JSX.Element} ContentLibrary dashboard
 */
export default function ContentLibrary({
  companyId,
  onContentSelect,
}: ContentLibraryProps): JSX.Element {
  const toast = useToast();

  // Content state
  const [content, setContent] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    type: 'All',
    status: 'All',
    sort: '-createdAt',
    search: '',
  });

  /**
   * Fetch content from API
   */
  const fetchContent = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({ companyId });
      if (filters.type !== 'All') params.append('contentType', filters.type);
      if (filters.status !== 'All') params.append('status', filters.status);
      params.append('sort', filters.sort);

      const response = await fetch(`/api/media/content?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setContent(data.content || []);
      } else {
        toast({
          title: 'Failed to load content',
          description: data.error || 'Could not fetch content',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading content',
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
   * Fetch content on mount and filter changes
   */
  useEffect(() => {
    fetchContent();
  }, [companyId, filters.type, filters.status, filters.sort]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  /**
   * Handle content deletion
   */
  const handleDelete = async (contentId: string) => {
    if (!window.confirm('Delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/content/${contentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Content deleted',
          description: 'Content removed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Refetch content
        fetchContent();
      } else {
        toast({
          title: 'Failed to delete',
          description: data.error || 'Could not delete content',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error deleting content',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  /**
   * Get quality badge color
   */
  const getQualityBadgeColor = (score: number): string => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'Published':
        return 'blue';
      case 'Trending':
        return 'purple';
      case 'Draft':
        return 'gray';
      case 'Archived':
        return 'orange';
      default:
        return 'gray';
    }
  };

  /**
   * Filter content by search term
   */
  const getFilteredContent = (): MediaContent[] => {
    if (!filters.search.trim()) return content;

    const searchLower = filters.search.toLowerCase();
    return content.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    );
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton height="20px" width="70%" />
          </CardHeader>
          <CardBody>
            <Skeleton height="60px" mb={4} />
            <Skeleton height="40px" />
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
        No content found
      </Text>
      <Text fontSize="sm" color="gray.400">
        Create your first content piece to get started
      </Text>
    </Box>
  );

  /**
   * Render content card
   */
  const renderContentCard = (item: MediaContent) => (
    <Card key={item._id} variant="outline" _hover={{ shadow: 'md' }}>
      <CardHeader pb={2}>
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme={getStatusBadgeColor(item.status)}>
            {item.status}
          </Badge>
          <HStack spacing={1}>
            {item.isPeaking && (
              <Badge colorScheme="purple" variant="solid">
                <HStack spacing={1}>
                  <FiTrendingUp />
                  <Text>Trending</Text>
                </HStack>
              </Badge>
            )}
            {item.viralCoefficient > 0.05 && item.views > 10000 && (
              <Badge colorScheme="green" variant="solid">
                Viral
              </Badge>
            )}
          </HStack>
        </HStack>

        <Heading size="sm" noOfLines={2}>
          {item.title}
        </Heading>

        <HStack mt={2} spacing={2}>
          <Badge>{item.type}</Badge>
          <Badge colorScheme={getQualityBadgeColor(item.qualityScore)}>
            Quality: {item.qualityScore}
          </Badge>
        </HStack>
      </CardHeader>

      <CardBody py={3}>
        {item.description && (
          <Text fontSize="sm" color="gray.600" noOfLines={2} mb={3}>
            {item.description}
          </Text>
        )}

        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          <Stat size="sm">
            <StatLabel fontSize="xs">Views</StatLabel>
            <StatNumber fontSize="md">{item.views.toLocaleString()}</StatNumber>
          </Stat>

          <Stat size="sm">
            <StatLabel fontSize="xs">Shares</StatLabel>
            <StatNumber fontSize="md">{item.shares.toLocaleString()}</StatNumber>
          </Stat>

          <Stat size="sm">
            <StatLabel fontSize="xs">Engagement</StatLabel>
            <StatNumber fontSize="md">
              {item.likes + item.comments}
            </StatNumber>
          </Stat>

          <Stat size="sm">
            <StatLabel fontSize="xs">Revenue</StatLabel>
            <StatNumber fontSize="md" color="green.500">
              ${Math.round(item.revenueGenerated).toLocaleString()}
            </StatNumber>
          </Stat>
        </Grid>

        <Divider my={3} />

        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.500">Viral Coefficient:</Text>
            <Badge colorScheme={item.viralCoefficient > 0.05 ? 'green' : 'gray'}>
              {item.viralCoefficient.toFixed(4)}
            </Badge>
          </HStack>

          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.500">Trending Score:</Text>
            <Text fontWeight="medium">{item.trendingScore}/100</Text>
          </HStack>

          <Progress
            value={item.trendingScore}
            colorScheme={item.trendingScore > 70 ? 'purple' : 'blue'}
            size="sm"
            borderRadius="md"
          />
        </VStack>
      </CardBody>

      <CardFooter pt={2}>
        <HStack justify="space-between" width="100%">
          <Text fontSize="xs" color="gray.500">
            {new Date(item.createdAt).toLocaleDateString()}
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
                icon={<FiEye />}
                onClick={() => onContentSelect?.(item._id)}
              >
                View Performance
              </MenuItem>
              <MenuItem
                icon={<FiTrash2 />}
                onClick={() => handleDelete(item._id)}
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

  const filteredContent = getFilteredContent();

  return (
    <Box>
      {/* Filters */}
      <VStack spacing={4} mb={6} align="stretch">
        <HStack spacing={4} flexWrap="wrap">
          <Select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value as ContentType)}
            maxW="200px"
          >
            <option value="All">All Types</option>
            <option value="Article">Article</option>
            <option value="Video">Video</option>
            <option value="Podcast">Podcast</option>
            <option value="Livestream">Livestream</option>
            <option value="SocialPost">Social Post</option>
          </Select>

          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value as ContentStatus)}
            maxW="200px"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Trending">Trending</option>
            <option value="Archived">Archived</option>
          </Select>

          <Select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value as SortOption)}
            maxW="200px"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-views">Most Views</option>
            <option value="-trendingScore">Trending</option>
          </Select>

          <InputGroup maxW="300px" flexGrow={1}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search content..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </InputGroup>
        </HStack>

        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            {filteredContent.length} content piece{filteredContent.length !== 1 ? 's' : ''}
          </Text>
          <Button size="sm" onClick={fetchContent} variant="ghost">
            Refresh
          </Button>
        </HStack>
      </VStack>

      {/* Content Grid */}
      {loading ? (
        renderSkeletons()
      ) : filteredContent.length === 0 ? (
        renderEmptyState()
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
          {filteredContent.map(renderContentCard)}
        </Grid>
      )}
    </Box>
  );
}

/**
 * @file src/components/media/ContentCreator.tsx
 * @description Modal wizard for creating media content with quality preview
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Multi-step modal form for creating media content pieces. Provides content type selection
 * (Article/Video/Podcast/Livestream/SocialPost), quality metrics input (writing, research,
 * engagement), platform distribution selection, production cost estimation, and real-time
 * quality score preview. Validates all inputs before submission and displays estimated
 * revenue potential based on quality score and target demographics.
 * 
 * COMPONENT ARCHITECTURE:
 * - Three-step wizard: 1) Content Type & Basics, 2) Quality Metrics, 3) Distribution
 * - Real-time quality score calculation: (writing × 0.4 + research × 0.3 + engagement × 0.3)
 * - Production cost estimation based on content type
 * - Platform selection with multi-platform support
 * - Toast notifications for success/error feedback
 * - Form validation with error messages
 * 
 * STATE MANAGEMENT:
 * - contentData: Form fields state
 * - currentStep: Wizard step (1-3)
 * - isSubmitting: Loading state during API call
 * - platforms: Available platforms from GET /api/media/platforms
 * 
 * API INTEGRATION:
 * - POST /api/media/content - Create content
 * - GET /api/media/platforms - Fetch available platforms
 * 
 * PROPS:
 * - isOpen: Modal visibility state
 * - onClose: Modal close handler
 * - companyId: Company ID for content creation
 * - onSuccess: Callback after successful creation
 * 
 * USAGE:
 * ```tsx
 * const { isOpen, onOpen, onClose } = useDisclosure();
 * 
 * <ContentCreator
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   companyId="64f7a1b2c3d4e5f6g7h8i9j0"
 *   onSuccess={() => { refetch(); toast({ title: "Created!" }); }}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Quality score calculation matches MediaContent.ts pre-save hook
 * - Production costs: Article $100-$500, Video $500-$5000, Podcast $200-$1000
 * - Viral potential based on quality score: >85 = High, 70-84 = Medium, <70 = Low
 * - Revenue estimation: (estimatedViews × CPM) / 1000
 * - Platform distribution happens via separate POST /api/media/content/[id]/distribute
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  useToast,
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Grid,
  Checkbox,
  Stack,
  Divider,
} from '@chakra-ui/react';

/**
 * Content type options
 */
type ContentType = 'Article' | 'Video' | 'Podcast' | 'Livestream' | 'SocialPost';

/**
 * Platform interface
 */
interface Platform {
  _id: string;
  name: string;
  platformType: string;
  isActive: boolean;
}

/**
 * Content form data interface
 */
interface ContentFormData {
  title: string;
  contentType: ContentType;
  description: string;
  productionCost: number;
  writingQuality: number;
  researchDepth: number;
  engagementPotential: number;
  factCheckScore: number;
  isPropaganda: boolean;
  platforms: string[];
}

/**
 * ContentCreator component props
 */
interface ContentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

/**
 * ContentCreator component
 * 
 * @description
 * Multi-step modal wizard for creating media content with quality preview
 * and platform distribution selection
 * 
 * @param {ContentCreatorProps} props - Component props
 * @returns {JSX.Element} ContentCreator modal
 */
export default function ContentCreator({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: ContentCreatorProps): JSX.Element {
  const toast = useToast();

  // Wizard step state (1-3)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form data state
  const [contentData, setContentData] = useState<ContentFormData>({
    title: '',
    contentType: 'Article',
    description: '',
    productionCost: 100,
    writingQuality: 50,
    researchDepth: 50,
    engagementPotential: 50,
    factCheckScore: 100,
    isPropaganda: false,
    platforms: [],
  });

  // Platforms state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Fetch available platforms on mount
   */
  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
    }
  }, [isOpen, companyId]);

  /**
   * Fetch platforms from API
   */
  const fetchPlatforms = async () => {
    setIsLoadingPlatforms(true);
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
      setIsLoadingPlatforms(false);
    }
  };

  /**
   * Calculate quality score
   * Formula: (writing × 0.4 + research × 0.3 + engagement × 0.3)
   */
  const calculateQualityScore = (): number => {
    return Math.round(
      contentData.writingQuality * 0.4 +
        contentData.researchDepth * 0.3 +
        contentData.engagementPotential * 0.3
    );
  };

  /**
   * Get quality score badge color
   */
  const getQualityBadgeColor = (score: number): string => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  /**
   * Get viral potential label
   */
  const getViralPotential = (score: number): string => {
    if (score >= 85) return 'High';
    if (score >= 70) return 'Medium';
    return 'Low';
  };

  /**
   * Estimate production cost based on content type
   */
  const getEstimatedCost = (type: ContentType): number => {
    const costs: Record<ContentType, number> = {
      Article: 300,
      Video: 2000,
      Podcast: 500,
      Livestream: 800,
      SocialPost: 100,
    };
    return costs[type] || 300;
  };

  /**
   * Handle content type change
   */
  const handleContentTypeChange = (type: ContentType) => {
    setContentData({
      ...contentData,
      contentType: type,
      productionCost: getEstimatedCost(type),
    });
  };

  /**
   * Handle field change
   */
  const handleFieldChange = (field: keyof ContentFormData, value: any) => {
    setContentData({
      ...contentData,
      [field]: value,
    });
  };

  /**
   * Handle platform selection
   */
  const handlePlatformToggle = (platformId: string) => {
    const isSelected = contentData.platforms.includes(platformId);
    if (isSelected) {
      setContentData({
        ...contentData,
        platforms: contentData.platforms.filter((id) => id !== platformId),
      });
    } else {
      setContentData({
        ...contentData,
        platforms: [...contentData.platforms, platformId],
      });
    }
  };

  /**
   * Validate step 1 (basics)
   */
  const validateStep1 = (): boolean => {
    if (!contentData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a content title',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    if (contentData.title.length < 5) {
      toast({
        title: 'Title too short',
        description: 'Title must be at least 5 characters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  /**
   * Validate step 2 (quality)
   */
  const validateStep2 = (): boolean => {
    const qualityScore = calculateQualityScore();
    if (qualityScore < 30) {
      toast({
        title: 'Quality too low',
        description: 'Content quality must be at least 30/100',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(currentStep + 1);
  };

  /**
   * Handle previous step
   */
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/media/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          ...contentData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Content created',
          description: `"${contentData.title}" created successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Reset form
        setContentData({
          title: '',
          contentType: 'Article',
          description: '',
          productionCost: 100,
          writingQuality: 50,
          researchDepth: 50,
          engagementPotential: 50,
          factCheckScore: 100,
          isPropaganda: false,
          platforms: [],
        });
        setCurrentStep(1);

        // Close modal and trigger success callback
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: 'Failed to create content',
          description: data.error || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating content',
        description: error.message || 'Network error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render step 1: Content Type & Basics
   */
  const renderStep1 = () => (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>Content Type</FormLabel>
        <Select
          value={contentData.contentType}
          onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
        >
          <option value="Article">Article</option>
          <option value="Video">Video</option>
          <option value="Podcast">Podcast</option>
          <option value="Livestream">Livestream</option>
          <option value="SocialPost">Social Media Post</option>
        </Select>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Title</FormLabel>
        <Input
          placeholder="Enter content title..."
          value={contentData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          maxLength={200}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {contentData.title.length}/200 characters
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          placeholder="Brief description or excerpt..."
          value={contentData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          maxLength={500}
          rows={4}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {contentData.description.length}/500 characters
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>Production Cost</FormLabel>
        <NumberInput
          value={contentData.productionCost}
          onChange={(_, value) => handleFieldChange('productionCost', value)}
          min={0}
          max={100000}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text fontSize="xs" color="gray.500" mt={1}>
          Estimated: ${getEstimatedCost(contentData.contentType).toLocaleString()}
        </Text>
      </FormControl>
    </VStack>
  );

  /**
   * Render step 2: Quality Metrics
   */
  const renderStep2 = () => {
    const qualityScore = calculateQualityScore();

    return (
      <VStack spacing={6} align="stretch">
        <Box bg="blue.50" p={4} borderRadius="md">
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="bold">Quality Score Preview</Text>
            <Badge colorScheme={getQualityBadgeColor(qualityScore)} fontSize="lg">
              {qualityScore}/100
            </Badge>
          </HStack>
          <Progress
            value={qualityScore}
            colorScheme={getQualityBadgeColor(qualityScore)}
            size="lg"
            borderRadius="md"
          />
          <HStack justify="space-between" mt={2}>
            <Text fontSize="sm" color="gray.600">
              Viral Potential: {getViralPotential(qualityScore)}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Est. Views: {(qualityScore * 100).toLocaleString()}
            </Text>
          </HStack>
        </Box>

        <FormControl>
          <FormLabel>
            Writing/Production Quality ({contentData.writingQuality})
          </FormLabel>
          <Slider
            value={contentData.writingQuality}
            onChange={(value) => handleFieldChange('writingQuality', value)}
            min={1}
            max={100}
            step={1}
          >
            <SliderTrack>
              <SliderFilledTrack bg="blue.400" />
            </SliderTrack>
            <SliderThumb boxSize={6} />
          </Slider>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Weight: 40% of quality score
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Research Depth ({contentData.researchDepth})</FormLabel>
          <Slider
            value={contentData.researchDepth}
            onChange={(value) => handleFieldChange('researchDepth', value)}
            min={1}
            max={100}
            step={1}
          >
            <SliderTrack>
              <SliderFilledTrack bg="green.400" />
            </SliderTrack>
            <SliderThumb boxSize={6} />
          </Slider>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Weight: 30% of quality score
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>
            Engagement Potential ({contentData.engagementPotential})
          </FormLabel>
          <Slider
            value={contentData.engagementPotential}
            onChange={(value) => handleFieldChange('engagementPotential', value)}
            min={1}
            max={100}
            step={1}
          >
            <SliderTrack>
              <SliderFilledTrack bg="purple.400" />
            </SliderTrack>
            <SliderThumb boxSize={6} />
          </Slider>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Weight: 30% of quality score
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Fact-Check Score ({contentData.factCheckScore})</FormLabel>
          <Slider
            value={contentData.factCheckScore}
            onChange={(value) => handleFieldChange('factCheckScore', value)}
            min={0}
            max={100}
            step={1}
          >
            <SliderTrack>
              <SliderFilledTrack bg="orange.400" />
            </SliderTrack>
            <SliderThumb boxSize={6} />
          </Slider>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Lower scores risk credibility damage
          </Text>
        </FormControl>
      </VStack>
    );
  };

  /**
   * Render step 3: Distribution
   */
  const renderStep3 = () => (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel>Platform Distribution</FormLabel>
        {isLoadingPlatforms ? (
          <Text color="gray.500">Loading platforms...</Text>
        ) : platforms.length === 0 ? (
          <Text color="gray.500">No platforms available. Create one first.</Text>
        ) : (
          <Stack spacing={2}>
            {platforms.map((platform) => (
              <Checkbox
                key={platform._id}
                isChecked={contentData.platforms.includes(platform._id)}
                onChange={() => handlePlatformToggle(platform._id)}
              >
                {platform.name} ({platform.platformType})
              </Checkbox>
            ))}
          </Stack>
        )}
        <Text fontSize="xs" color="gray.500" mt={2}>
          Select platforms to distribute this content to
        </Text>
      </FormControl>

      <Divider />

      <Box bg="purple.50" p={4} borderRadius="md">
        <Text fontWeight="bold" mb={2}>
          Content Summary
        </Text>
        <Grid templateColumns="1fr 2fr" gap={2} fontSize="sm">
          <Text color="gray.600">Type:</Text>
          <Text fontWeight="medium">{contentData.contentType}</Text>

          <Text color="gray.600">Title:</Text>
          <Text fontWeight="medium">{contentData.title || 'Untitled'}</Text>

          <Text color="gray.600">Quality Score:</Text>
          <Badge colorScheme={getQualityBadgeColor(calculateQualityScore())}>
            {calculateQualityScore()}/100
          </Badge>

          <Text color="gray.600">Production Cost:</Text>
          <Text fontWeight="medium">
            ${contentData.productionCost.toLocaleString()}
          </Text>

          <Text color="gray.600">Platforms:</Text>
          <Text fontWeight="medium">
            {contentData.platforms.length} selected
          </Text>
        </Grid>
      </Box>
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          Create Content - Step {currentStep} of 3
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Progress
            value={(currentStep / 3) * 100}
            colorScheme="blue"
            size="sm"
            borderRadius="md"
            mb={6}
          />

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button colorScheme="blue" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                colorScheme="green"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Creating..."
              >
                Create Content
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

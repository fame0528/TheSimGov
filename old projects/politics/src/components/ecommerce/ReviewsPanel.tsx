/**
 * @file src/components/ecommerce/ReviewsPanel.tsx
 * @description Customer reviews display with filtering and moderation interface
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Comprehensive review management panel displaying customer reviews with
 * moderation capabilities. Integrates with GET /api/ecommerce/reviews
 * endpoint. Supports filtering by rating, verified purchases, and status.
 * 
 * FEATURES:
 * - Review listing with pagination
 * - Filter by rating (1-5 stars) and verified purchase status
 * - Helpfulness voting (helpful/not helpful)
 * - Moderation actions (approve/reject/report)
 * - Verified purchase badge display
 * - Average rating summary
 * - Report abuse functionality
 * 
 * USAGE:
 * ```tsx
 * <ReviewsPanel productId="123" companyId="456" showModeration={true} />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  Divider,
  Avatar,
  Select,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiStar, FiThumbsUp, FiThumbsDown, FiFlag, FiCheck, FiX } from 'react-icons/fi';

interface Review {
  _id: string;
  customerId: string;
  customerName?: string;
  productId: string;
  rating: number;
  reviewText: string;
  verifiedPurchase: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  helpfulCount: number;
  notHelpfulCount: number;
  reportCount: number;
  createdAt: string;
}

interface ReviewsPanelProps {
  productId: string;
  companyId: string;
  showModeration?: boolean; // Admin moderation view
  currentUserId?: string; // For voting actions
}

export default function ReviewsPanel({
  productId,
  companyId,
  showModeration = false,
  currentUserId,
}: ReviewsPanelProps) {
  const toast = useToast();

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(showModeration ? 'Pending' : 'Approved');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  /**
   * Fetch reviews with filters
   */
  const fetchReviews = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        companyId,
        productId,
        limit: limit.toString(),
        skip: ((page - 1) * limit).toString(),
      });

      if (ratingFilter) params.append('rating', ratingFilter.toString());
      if (verifiedOnly) params.append('verifiedPurchase', 'true');
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/ecommerce/reviews?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews);
      setTotal(data.pagination.total);
    } catch (error) {
      toast({
        title: 'Error loading reviews',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, productId, ratingFilter, verifiedOnly, statusFilter, page, limit, toast]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  /**
   * Handle moderation action (approve/reject)
   */
  const handleModeration = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/ecommerce/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} review`);

      toast({
        title: `Review ${action}d`,
        status: 'success',
        duration: 3000,
      });

      void fetchReviews(); // Refresh list
    } catch (error) {
      toast({
        title: `Failed to ${action} review`,
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  /**
   * Handle helpfulness vote
   */
  const handleVote = async (reviewId: string, helpful: boolean) => {
    if (!currentUserId) {
      toast({
        title: 'Login required',
        description: 'Please login to vote on reviews',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/ecommerce/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'vote',
          helpful,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit vote');

      toast({
        title: 'Vote recorded',
        status: 'success',
        duration: 2000,
      });

      void fetchReviews(); // Refresh to show updated counts
    } catch (error) {
      toast({
        title: 'Failed to submit vote',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  /**
   * Report review abuse
   */
  const handleReport = async (reviewId: string) => {
    if (!currentUserId) {
      toast({
        title: 'Login required',
        description: 'Please login to report reviews',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/ecommerce/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'report',
        }),
      });

      if (!response.ok) throw new Error('Failed to report review');

      toast({
        title: 'Review reported',
        description: 'Thank you for helping maintain quality reviews',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to report review',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  /**
   * Calculate average rating
   */
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="flex-start" spacing={0}>
          <Heading size="lg">
            {showModeration ? 'Review Moderation' : 'Customer Reviews'}
          </Heading>
          <HStack spacing={2}>
            <HStack spacing={0}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  as={FiStar}
                  color={i < Math.round(averageRating) ? 'yellow.400' : 'gray.300'}
                  fill={i < Math.round(averageRating) ? 'yellow.400' : 'none'}
                />
              ))}
            </HStack>
            <Text fontSize="lg" fontWeight="medium">
              {averageRating.toFixed(1)} ({total} reviews)
            </Text>
          </HStack>
        </VStack>

        {/* Filters */}
        <HStack spacing={4}>
          <Select
            w="150px"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : '')}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </Select>

          {showModeration && (
            <Select w="150px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          )}

          <Button
            size="sm"
            variant={verifiedOnly ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
          >
            Verified Only
          </Button>
        </HStack>
      </Flex>

      {/* Reviews List */}
      {loading ? (
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading reviews...</Text>
          </VStack>
        </Flex>
      ) : reviews.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No reviews found. {showModeration ? 'Check back later.' : 'Be the first to review!'}
        </Alert>
      ) : (
        <VStack spacing={4} align="stretch">
          {reviews.map((review) => (
            <Box key={review._id} bg="white" p={6} borderRadius="md" shadow="sm">
              {/* Review Header */}
              <Flex justify="space-between" align="flex-start" mb={4}>
                <HStack spacing={4}>
                  <Avatar name={review.customerName || 'Anonymous'} size="md" />
                  <VStack align="flex-start" spacing={0}>
                    <HStack>
                      <Text fontWeight="bold">{review.customerName || 'Anonymous'}</Text>
                      {review.verifiedPurchase && (
                        <Badge colorScheme="green" fontSize="xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </HStack>
                    <HStack spacing={1}>
                      {[...Array(5)].map((_, i) => (
                        <Box
                          key={i}
                          as={FiStar}
                          boxSize={4}
                          color={i < review.rating ? 'yellow.400' : 'gray.300'}
                          fill={i < review.rating ? 'yellow.400' : 'none'}
                        />
                      ))}
                      <Text fontSize="sm" color="gray.500" ml={2}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>

                {/* Status Badge */}
                {showModeration && (
                  <Badge
                    colorScheme={
                      review.status === 'Approved'
                        ? 'green'
                        : review.status === 'Rejected'
                        ? 'red'
                        : 'yellow'
                    }
                  >
                    {review.status}
                  </Badge>
                )}
              </Flex>

              {/* Review Text */}
              <Text mb={4}>{review.reviewText}</Text>

              <Divider mb={4} />

              {/* Review Actions */}
              <Flex justify="space-between" align="center">
                {/* Helpfulness Voting */}
                <HStack spacing={4}>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiThumbsUp />}
                    onClick={() => void handleVote(review._id, true)}
                  >
                    Helpful ({review.helpfulCount})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiThumbsDown />}
                    onClick={() => void handleVote(review._id, false)}
                  >
                    Not Helpful ({review.notHelpfulCount})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiFlag />}
                    colorScheme="red"
                    onClick={() => void handleReport(review._id)}
                  >
                    Report
                  </Button>
                </HStack>

                {/* Moderation Actions */}
                {showModeration && review.status === 'Pending' && (
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FiCheck />}
                      onClick={() => void handleModeration(review._id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FiX />}
                      onClick={() => void handleModeration(review._id, 'reject')}
                    >
                      Reject
                    </Button>
                  </HStack>
                )}
              </Flex>

              {/* Report Warning */}
              {review.reportCount >= 3 && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  This review has been reported {review.reportCount} times
                </Alert>
              )}
            </Box>
          ))}

          {/* Pagination */}
          <Flex justify="space-between" align="center" mt={4}>
            <Text>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </Text>
            <HStack spacing={2}>
              <Button size="sm" onClick={() => setPage(page - 1)} isDisabled={page === 1}>
                Previous
              </Button>
              <Text fontWeight="medium">Page {page}</Text>
              <Button
                size="sm"
                onClick={() => setPage(page + 1)}
                isDisabled={page * limit >= total}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </VStack>
      )}
    </Box>
  );
}

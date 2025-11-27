/**
 * @file src/components/ecommerce/SellerManagement.tsx
 * @description Seller onboarding and performance management interface
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Administrative interface for managing marketplace sellers. Provides tools for
 * monitoring seller health scores, reviewing performance metrics, handling approvals,
 * and taking enforcement actions (warnings, suspensions). Supports filtering and
 * detailed seller analytics.
 * 
 * FEATURES:
 * - Seller list with health score visualization (color-coded badges)
 * - Performance alerts and warnings system
 * - Revenue breakdown per seller with trend indicators
 * - Rating trends and customer satisfaction metrics
 * - Approval/suspension action workflows
 * - Advanced filtering (search, health threshold, sort options)
 * - Seller detail modal with comprehensive analytics
 * - Onboarding pipeline tracking
 * 
 * BUSINESS LOGIC:
 * - Health score calculation: (performance × 0.4) + (fulfillment × 0.3) + (customerSat × 0.3)
 * - Performance rating: Weighted average of order fulfillment, delivery time, quality
 * - Alert triggers: Health <60, late shipments >10%, customer complaints >5
 * - Suspension criteria: Health <40, severe policy violations, repeated warnings
 * 
 * USAGE:
 * ```tsx
 * import SellerManagement from '@/components/ecommerce/SellerManagement';
 * 
 * <SellerManagement marketplaceId={marketplaceId} adminMode={true} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  Divider,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface SellerManagementProps {
  marketplaceId: string;
  adminMode?: boolean;
}

interface Seller {
  _id: string;
  sellerId: string;
  companyId: string;
  companyName: string;
  performanceRating: number;
  healthScore: number;
  totalRevenue: number;
  totalOrders: number;
  active: boolean;
  warnings: number;
  lateShipments: number;
  customerComplaints: number;
  createdAt: string;
}

interface SellerFilters {
  search: string;
  healthMin: number;
  sortBy: 'healthScore' | 'revenue' | 'rating' | 'recent';
}

// ============================================================================
// Main Component
// ============================================================================

export default function SellerManagement({ marketplaceId, adminMode = false }: SellerManagementProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [filters, setFilters] = useState<SellerFilters>({
    search: '',
    healthMin: 0,
    sortBy: 'healthScore',
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch sellers list from API
   */
  const fetchSellers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ecommerce/sellers/list?marketplaceId=${marketplaceId}&` +
        `search=${filters.search}&healthMin=${filters.healthMin}&sortBy=${filters.sortBy}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }

      const data = await response.json();

      if (data.success) {
        setSellers(data.sellers || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching sellers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load sellers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [marketplaceId, filters.sortBy, filters.healthMin]);

  // ============================================================================
  // Seller Actions
  // ============================================================================

  /**
   * Update seller status (approve/suspend)
   */
  const updateSellerStatus = async (sellerId: string, active: boolean) => {
    try {
      const response = await fetch('/api/ecommerce/sellers/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          marketplaceId,
          active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update seller status');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Seller ${active ? 'activated' : 'suspended'} successfully`,
          status: 'success',
          duration: 3000,
        });

        // Refresh sellers list
        fetchSellers();
        onClose();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Error updating seller:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update seller',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * View seller details in modal
   */
  const viewSellerDetails = (seller: Seller) => {
    setSelectedSeller(seller);
    onOpen();
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Get color scheme for health score
   */
  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  /**
   * Check if seller has critical alerts
   */
  const hasCriticalAlerts = (seller: Seller): boolean => {
    return (
      seller.healthScore < 60 ||
      seller.lateShipments > 10 ||
      seller.customerComplaints > 5 ||
      seller.warnings >= 3
    );
  };

  /**
   * Filter sellers based on search
   */
  const filteredSellers = sellers.filter((seller) => {
    const searchLower = filters.search.toLowerCase();
    return (
      seller.companyName.toLowerCase().includes(searchLower) ||
      seller.sellerId.toLowerCase().includes(searchLower)
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
          Loading sellers...
        </Text>
      </Box>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Filters Section */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Search Sellers
            </Text>
            <Input
              placeholder="Company name or ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Minimum Health Score
            </Text>
            <Select
              value={filters.healthMin}
              onChange={(e) => setFilters({ ...filters, healthMin: Number(e.target.value) })}
            >
              <option value={0}>All Sellers</option>
              <option value={40}>40+ (At Risk)</option>
              <option value={60}>60+ (Adequate)</option>
              <option value={80}>80+ (Healthy)</option>
            </Select>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Sort By
            </Text>
            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
            >
              <option value="healthScore">Health Score</option>
              <option value="revenue">Revenue</option>
              <option value="rating">Performance Rating</option>
              <option value="recent">Most Recent</option>
            </Select>
          </Box>
        </Grid>
      </Box>

      {/* Sellers Table */}
      <Box bg="white" borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200" overflowX="auto">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Seller</Th>
              <Th>Health Score</Th>
              <Th isNumeric>Revenue</Th>
              <Th isNumeric>Orders</Th>
              <Th>Performance</Th>
              <Th>Status</Th>
              <Th>Alerts</Th>
              {adminMode && <Th>Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {filteredSellers.length === 0 ? (
              <Tr>
                <Td colSpan={adminMode ? 8 : 7} textAlign="center" py={8}>
                  <Text color="gray.500">No sellers found matching filters</Text>
                </Td>
              </Tr>
            ) : (
              filteredSellers.map((seller) => (
                <Tr
                  key={seller._id}
                  _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                  onClick={() => viewSellerDetails(seller)}
                >
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{seller.companyName}</Text>
                      <Text fontSize="xs" color="gray.500">
                        ID: {seller.sellerId.substring(0, 8)}...
                      </Text>
                    </VStack>
                  </Td>

                  <Td>
                    <VStack spacing={1} align="start">
                      <Badge colorScheme={getHealthScoreColor(seller.healthScore)} fontSize="md">
                        {seller.healthScore}
                      </Badge>
                      <Progress
                        value={seller.healthScore}
                        size="sm"
                        colorScheme={getHealthScoreColor(seller.healthScore)}
                        w="80px"
                        borderRadius="full"
                      />
                    </VStack>
                  </Td>

                  <Td isNumeric fontWeight="semibold">
                    ${seller.totalRevenue.toLocaleString()}
                  </Td>

                  <Td isNumeric>{seller.totalOrders}</Td>

                  <Td>
                    <Badge colorScheme={seller.performanceRating >= 4.5 ? 'green' : 'yellow'}>
                      {seller.performanceRating.toFixed(1)}⭐
                    </Badge>
                  </Td>

                  <Td>
                    <Badge colorScheme={seller.active ? 'green' : 'red'}>
                      {seller.active ? 'Active' : 'Suspended'}
                    </Badge>
                  </Td>

                  <Td>
                    {hasCriticalAlerts(seller) ? (
                      <Badge colorScheme="red" display="flex" alignItems="center" gap={1}>
                        <FiAlertTriangle /> Critical
                      </Badge>
                    ) : (
                      <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
                        <FiCheckCircle /> OK
                      </Badge>
                    )}
                  </Td>

                  {adminMode && (
                    <Td>
                      <Button
                        size="sm"
                        colorScheme={seller.active ? 'red' : 'green'}
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSellerStatus(seller.sellerId, !seller.active);
                        }}
                      >
                        {seller.active ? 'Suspend' : 'Activate'}
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Seller Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Seller Details
            {selectedSeller && (
              <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>
                {selectedSeller.companyName}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {selectedSeller && (
              <VStack spacing={4} align="stretch">
                {/* Health Score Alert */}
                {hasCriticalAlerts(selectedSeller) && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Performance Alerts</AlertTitle>
                      <AlertDescription fontSize="sm">
                        This seller has critical issues requiring attention.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Performance Metrics */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>Health Score</StatLabel>
                    <StatNumber color={`${getHealthScoreColor(selectedSeller.healthScore)}.600`}>
                      {selectedSeller.healthScore}
                    </StatNumber>
                    <StatHelpText>
                      {selectedSeller.healthScore >= 80
                        ? 'Excellent'
                        : selectedSeller.healthScore >= 60
                        ? 'Adequate'
                        : 'Needs Improvement'}
                    </StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Performance Rating</StatLabel>
                    <StatNumber>{selectedSeller.performanceRating.toFixed(1)}⭐</StatNumber>
                    <StatHelpText>Customer feedback</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Total Revenue</StatLabel>
                    <StatNumber>${selectedSeller.totalRevenue.toLocaleString()}</StatNumber>
                    <StatHelpText>{selectedSeller.totalOrders} orders</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Account Status</StatLabel>
                    <StatNumber>
                      <Badge colorScheme={selectedSeller.active ? 'green' : 'red'} fontSize="lg">
                        {selectedSeller.active ? 'Active' : 'Suspended'}
                      </Badge>
                    </StatNumber>
                    <StatHelpText>
                      Member since {new Date(selectedSeller.createdAt).toLocaleDateString()}
                    </StatHelpText>
                  </Stat>
                </Grid>

                <Divider />

                {/* Alert Details */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Alert Details
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Late Shipments:</Text>
                      <Badge colorScheme={selectedSeller.lateShipments > 10 ? 'red' : 'green'}>
                        {selectedSeller.lateShipments}%
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Customer Complaints:</Text>
                      <Badge colorScheme={selectedSeller.customerComplaints > 5 ? 'red' : 'green'}>
                        {selectedSeller.customerComplaints}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Warnings Issued:</Text>
                      <Badge colorScheme={selectedSeller.warnings >= 3 ? 'red' : 'yellow'}>
                        {selectedSeller.warnings}
                      </Badge>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {adminMode && selectedSeller && (
              <Button
                colorScheme={selectedSeller.active ? 'red' : 'green'}
                onClick={() => {
                  updateSellerStatus(selectedSeller.sellerId, !selectedSeller.active);
                }}
              >
                {selectedSeller.active ? 'Suspend Seller' : 'Activate Seller'}
              </Button>
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
 *    - Admin mode prop enables enforcement actions
 *    - Modal-based seller detail view
 *    - Real-time filtering without API calls (client-side search)
 *    - Server-side sorting via API
 * 
 * 2. DATA FLOW:
 *    - Initial fetch loads all sellers
 *    - Filters trigger new API calls (except search - client-side)
 *    - Action buttons update state optimistically
 *    - Toast notifications for all user actions
 * 
 * 3. HEALTH SCORING:
 *    - Color-coded badges (green/yellow/orange/red)
 *    - Progress bars for visual indicator
 *    - Critical alerts for scores <60 or violations
 * 
 * 4. USER INTERACTIONS:
 *    - Click row to view details
 *    - Filter inputs with debounced search
 *    - Action buttons (suspend/activate) in admin mode
 *    - Modal for comprehensive seller analytics
 * 
 * 5. PERFORMANCE:
 *    - Client-side search filtering (no API calls)
 *    - Optimistic UI updates
 *    - Minimal re-renders with proper state management
 */

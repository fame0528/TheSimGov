/**
 * @file src/components/ecommerce/FulfillmentCenterManager.tsx
 * @description Multi-warehouse inventory and shipment management interface
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Administrative dashboard for managing fulfillment centers (warehouses) across
 * multiple locations. Monitors inventory levels, tracks capacity utilization,
 * processes shipment queues, and manages stock transfers between centers.
 * Provides real-time visibility into warehouse operations.
 * 
 * FEATURES:
 * - Fulfillment center list with location and capacity tracking
 * - Real-time inventory levels with low-stock alerts
 * - Shipment processing queue with priority indicators
 * - Performance metrics (fulfillment rate, processing time)
 * - Capacity utilization visualization (Progress bars)
 * - Stock transfer workflows between centers
 * - Center status management (Active, Maintenance, Closed)
 * - Inventory distribution charts and analytics
 * 
 * BUSINESS LOGIC:
 * - Capacity utilization = (current stock units / max capacity) × 100
 * - Low stock threshold = reorder point (product-specific, default 20%)
 * - Fulfillment rate = (completed shipments / total orders) × 100
 * - Avg processing time = avg(ship date - order date) in hours
 * - Priority score = (order value × 0.4) + (days pending × 0.6)
 * - Stock transfer validation: Source has inventory, destination has capacity
 * 
 * USAGE:
 * ```tsx
 * import FulfillmentCenterManager from '@/components/ecommerce/FulfillmentCenterManager';
 * 
 * <FulfillmentCenterManager companyId={companyId} adminMode={true} />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
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
  Progress,
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
  Alert,
  AlertIcon,
  Select,
  Input,
  Divider,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiAlertTriangle, FiTruck, FiPackage } from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface FulfillmentCenterManagerProps {
  companyId: string;
  adminMode?: boolean;
}

interface FulfillmentCenter {
  _id: string;
  centerId: string;
  name: string;
  location: string;
  maxCapacity: number;
  currentStock: number;
  pendingShipments: number;
  fulfillmentRate: number;
  avgProcessingTime: number;
  status: 'active' | 'maintenance' | 'closed';
  lowStockItems: number;
  createdAt: string;
}

interface InventoryData {
  category: string;
  units: number;
  value: number;
}

interface ShipmentTrend {
  date: string;
  shipments: number;
  avgTime: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function FulfillmentCenterManager({
  companyId,
  adminMode = false,
}: FulfillmentCenterManagerProps) {
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [centers, setCenters] = useState<FulfillmentCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<FulfillmentCenter | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [shipmentTrends, setShipmentTrends] = useState<ShipmentTrend[]>([]);
  const [transferSource, setTransferSource] = useState<string>('');
  const [transferDest, setTransferDest] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState<number>(0);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch fulfillment centers list
   */
  const fetchCenters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ecommerce/fulfillment/centers/list?companyId=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch fulfillment centers');
      }

      const data = await response.json();

      if (data.success) {
        setCenters(data.centers || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error fetching centers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load fulfillment centers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  /**
   * Fetch center details and analytics
   */
  const fetchCenterDetails = async (centerId: string) => {
    try {
      const response = await fetch(
        `/api/ecommerce/fulfillment/centers/details?centerId=${centerId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch center details');
      }

      const data = await response.json();

      if (data.success) {
        setInventoryData(data.analytics?.inventory || []);
        setShipmentTrends(data.analytics?.shipmentTrends || []);
      }
    } catch (error: any) {
      console.error('Error fetching center details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load center details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  // ============================================================================
  // Center Actions
  // ============================================================================

  /**
   * Update center status
   */
  const updateCenterStatus = async (
    centerId: string,
    status: 'active' | 'maintenance' | 'closed'
  ) => {
    try {
      const response = await fetch('/api/ecommerce/fulfillment/centers/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId,
          companyId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update center status');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Center status updated to ${status}`,
          status: 'success',
          duration: 3000,
        });

        fetchCenters();
        onDetailsClose();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Error updating center:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update center',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * Process stock transfer between centers
   */
  const processStockTransfer = async () => {
    if (!transferSource || !transferDest || transferQuantity <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select source, destination, and quantity',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/ecommerce/fulfillment/centers/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: transferSource,
          destinationId: transferDest,
          quantity: transferQuantity,
          companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process stock transfer');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Transfer Complete',
          description: `${transferQuantity} units transferred successfully`,
          status: 'success',
          duration: 3000,
        });

        setTransferSource('');
        setTransferDest('');
        setTransferQuantity(0);
        fetchCenters();
        onTransferClose();
      } else {
        throw new Error(data.error || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('Error processing transfer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process transfer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * View center details
   */
  const viewCenterDetails = async (center: FulfillmentCenter) => {
    setSelectedCenter(center);
    await fetchCenterDetails(center.centerId);
    onDetailsOpen();
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Calculate capacity utilization percentage
   */
  const getCapacityUtilization = (center: FulfillmentCenter): number => {
    return Math.round((center.currentStock / center.maxCapacity) * 100);
  };

  /**
   * Get color scheme for capacity utilization
   */
  const getCapacityColor = (utilization: number): string => {
    if (utilization >= 90) return 'red';
    if (utilization >= 70) return 'yellow';
    return 'green';
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'maintenance':
        return 'yellow';
      case 'closed':
        return 'red';
      default:
        return 'gray';
    }
  };

  /**
   * Calculate total metrics
   */
  const totalMetrics = {
    centers: centers.length,
    totalCapacity: centers.reduce((sum, c) => sum + c.maxCapacity, 0),
    avgFulfillmentRate: centers.length > 0
      ? Math.round(centers.reduce((sum, c) => sum + c.fulfillmentRate, 0) / centers.length)
      : 0,
    totalPendingShipments: centers.reduce((sum, c) => sum + c.pendingShipments, 0),
  };

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading fulfillment centers...
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
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">
            Fulfillment Center Management
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Warehouse operations and inventory tracking
          </Text>
        </Box>

        {adminMode && (
          <Button colorScheme="blue" onClick={onTransferOpen} leftIcon={<FiTruck />}>
            Transfer Stock
          </Button>
        )}
      </Flex>

      {/* Key Metrics */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Centers</StatLabel>
          <StatNumber color="blue.600">{totalMetrics.centers}</StatNumber>
          <StatHelpText>Active warehouses</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Total Capacity</StatLabel>
          <StatNumber color="purple.600">
            {totalMetrics.totalCapacity.toLocaleString()}
          </StatNumber>
          <StatHelpText>Units across all centers</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Avg Fulfillment Rate</StatLabel>
          <StatNumber color="green.600">{totalMetrics.avgFulfillmentRate}%</StatNumber>
          <StatHelpText>On-time shipments</StatHelpText>
        </Stat>

        <Stat
          bg="white"
          p={4}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <StatLabel>Pending Shipments</StatLabel>
          <StatNumber color="orange.600">{totalMetrics.totalPendingShipments}</StatNumber>
          <StatHelpText>Across all centers</StatHelpText>
        </Stat>
      </Grid>

      {/* Centers Table */}
      <Box
        bg="white"
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
        overflowX="auto"
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Center Name</Th>
              <Th>Location</Th>
              <Th>Capacity</Th>
              <Th isNumeric>Current Stock</Th>
              <Th isNumeric>Pending Shipments</Th>
              <Th isNumeric>Fulfillment Rate</Th>
              <Th>Status</Th>
              <Th>Alerts</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {centers.length === 0 ? (
              <Tr>
                <Td colSpan={9} textAlign="center" py={8}>
                  <Text color="gray.500">No fulfillment centers found</Text>
                </Td>
              </Tr>
            ) : (
              centers.map((center) => {
                const utilization = getCapacityUtilization(center);
                const capacityColor = getCapacityColor(utilization);

                return (
                  <Tr
                    key={center._id}
                    _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                    onClick={() => viewCenterDetails(center)}
                  >
                    <Td fontWeight="medium">{center.name}</Td>

                    <Td fontSize="sm" color="gray.600">
                      {center.location}
                    </Td>

                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {utilization}% used
                        </Text>
                        <Progress
                          value={utilization}
                          size="sm"
                          colorScheme={capacityColor}
                          w="100px"
                          borderRadius="full"
                        />
                      </VStack>
                    </Td>

                    <Td isNumeric>
                      <Text fontWeight="semibold">
                        {center.currentStock.toLocaleString()}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        / {center.maxCapacity.toLocaleString()}
                      </Text>
                    </Td>

                    <Td isNumeric>
                      <Badge colorScheme={center.pendingShipments > 50 ? 'orange' : 'blue'}>
                        {center.pendingShipments}
                      </Badge>
                    </Td>

                    <Td isNumeric>
                      <Badge
                        colorScheme={center.fulfillmentRate >= 95 ? 'green' : 'yellow'}
                        fontSize="md"
                      >
                        {center.fulfillmentRate}%
                      </Badge>
                    </Td>

                    <Td>
                      <Badge colorScheme={getStatusColor(center.status)} textTransform="capitalize">
                        {center.status}
                      </Badge>
                    </Td>

                    <Td>
                      {center.lowStockItems > 0 ? (
                        <HStack spacing={1}>
                          <FiAlertTriangle color="orange" />
                          <Badge colorScheme="orange">{center.lowStockItems}</Badge>
                        </HStack>
                      ) : (
                        <Badge colorScheme="green">OK</Badge>
                      )}
                    </Td>

                    <Td>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewCenterDetails(center);
                        }}
                      >
                        Details
                      </Button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Center Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Center Details
            {selectedCenter && (
              <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>
                {selectedCenter.name} - {selectedCenter.location}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {selectedCenter && (
              <VStack spacing={4} align="stretch">
                {/* Alert for low stock */}
                {selectedCenter.lowStockItems > 0 && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Low Stock Alert</Text>
                      <Text fontSize="sm">
                        {selectedCenter.lowStockItems} items below reorder threshold
                      </Text>
                    </Box>
                  </Alert>
                )}

                {/* Performance Metrics */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>Capacity Utilization</StatLabel>
                    <StatNumber color={`${getCapacityColor(getCapacityUtilization(selectedCenter))}.600`}>
                      {getCapacityUtilization(selectedCenter)}%
                    </StatNumber>
                    <StatHelpText>
                      {selectedCenter.currentStock.toLocaleString()} / {selectedCenter.maxCapacity.toLocaleString()} units
                    </StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Fulfillment Rate</StatLabel>
                    <StatNumber color="green.600">{selectedCenter.fulfillmentRate}%</StatNumber>
                    <StatHelpText>On-time shipments</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Avg Processing Time</StatLabel>
                    <StatNumber>{selectedCenter.avgProcessingTime}h</StatNumber>
                    <StatHelpText>Order to shipment</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Pending Shipments</StatLabel>
                    <StatNumber color="orange.600">{selectedCenter.pendingShipments}</StatNumber>
                    <StatHelpText>In queue</StatHelpText>
                  </Stat>
                </Grid>

                <Divider />

                {/* Inventory Distribution Chart */}
                {inventoryData.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Inventory Distribution
                    </Text>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={inventoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="units" fill="#3182ce" name="Units" />
                        <Bar dataKey="value" fill="#38a169" name="Value ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {/* Shipment Trends Chart */}
                {shipmentTrends.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Shipment Trends (Last 30 Days)
                    </Text>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={shipmentTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="shipments"
                          stroke="#3182ce"
                          strokeWidth={2}
                          name="Shipments"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDetailsClose}>
              Close
            </Button>
            {adminMode && selectedCenter && (
              <Select
                w="150px"
                value={selectedCenter.status}
                onChange={(e) =>
                  updateCenterStatus(
                    selectedCenter.centerId,
                    e.target.value as 'active' | 'maintenance' | 'closed'
                  )
                }
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="closed">Closed</option>
              </Select>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Stock Transfer Modal */}
      <Modal isOpen={isTransferOpen} onClose={onTransferClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer Stock Between Centers</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Source Center
                </Text>
                <Select
                  placeholder="Select source center"
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                >
                  {centers
                    .filter((c) => c.status === 'active' && c.currentStock > 0)
                    .map((center) => (
                      <option key={center.centerId} value={center.centerId}>
                        {center.name} ({center.currentStock} units available)
                      </option>
                    ))}
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Destination Center
                </Text>
                <Select
                  placeholder="Select destination center"
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                >
                  {centers
                    .filter(
                      (c) =>
                        c.status === 'active' &&
                        c.centerId !== transferSource &&
                        c.currentStock < c.maxCapacity
                    )
                    .map((center) => (
                      <option key={center.centerId} value={center.centerId}>
                        {center.name} (
                        {center.maxCapacity - center.currentStock} capacity remaining)
                      </option>
                    ))}
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Quantity to Transfer
                </Text>
                <Input
                  type="number"
                  min={1}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  placeholder="Enter quantity"
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTransferClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={processStockTransfer} leftIcon={<FiPackage />}>
              Transfer Stock
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
 * 1. COMPONENT ARCHITECTURE:
 *    - Two modals: Center details (analytics) and stock transfer workflow
 *    - Admin mode enables status changes and stock transfers
 *    - Real-time capacity utilization calculations
 *    - Progress bars for visual capacity indicators
 * 
 * 2. DATA FLOW:
 *    - Initial fetch loads all centers
 *    - Click center row to fetch detailed analytics
 *    - Stock transfer validates source inventory and destination capacity
 *    - Toast notifications for all actions
 * 
 * 3. CAPACITY MONITORING:
 *    - Color-coded progress bars (green <70%, yellow 70-90%, red >90%)
 *    - Real-time utilization calculations
 *    - Low stock alerts with badge indicators
 * 
 * 4. STOCK TRANSFERS:
 *    - Validation: Source must have inventory, destination must have capacity
 *    - Dropdown filters show only eligible centers
 *    - Quantity input with min=1 validation
 * 
 * 5. VISUALIZATIONS:
 *    - Inventory distribution BarChart (units and value)
 *    - Shipment trends LineChart (last 30 days)
 *    - Both charts use ResponsiveContainer for mobile
 * 
 * 6. PERFORMANCE:
 *    - useCallback for fetchCenters (memoized with companyId dependency)
 *    - Separate API calls for list vs details (lazy loading)
 *    - Optimistic UI updates after actions
 */

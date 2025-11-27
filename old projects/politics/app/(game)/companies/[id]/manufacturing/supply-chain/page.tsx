/**
 * @file app/(game)/companies/[id]/manufacturing/supply-chain/page.tsx
 * @description Supply chain management page with supplier scorecards and procurement tracking
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Supply chain dashboard displaying suppliers with performance scorecards and procurement
 * orders with approval workflow tracking. Provides comprehensive view of vendor relationships,
 * on-time delivery rates, quality ratings, and procurement status.
 * 
 * FEATURES:
 * - Supplier list with performance tier filtering
 * - Supplier scorecard display (overall score, on-time delivery, quality, price, responsiveness)
 * - Procurement order list with status tracking (Draft, Submitted, Approved, Ordered, Received)
 * - Overdue order detection and highlighting
 * - Approval workflow visualization (Pending/Approved/Rejected)
 * - Total spend tracking by supplier
 * - Tier filtering (Tier 1/2/3)
 * - Search and filter capabilities
 */

'use client';

import React, { use, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { SupplierCard } from '../../../../../../src/components/manufacturing';

/**
 * Get order status color
 */
const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'gray';
    case 'Submitted':
      return 'blue';
    case 'Approved':
      return 'green';
    case 'Ordered':
      return 'purple';
    case 'Received':
      return 'teal';
    case 'Cancelled':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get approval status color
 */
const getApprovalStatusColor = (status: string): string => {
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

/**
 * Supply chain management page component
 */
export default function SupplyChainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [procurementOrders, setProcurementOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /**
   * Fetch suppliers and procurement orders
   */
  useEffect(() => {
    const fetchSupplyChainData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch suppliers
        const suppliersRes = await fetch(`/api/manufacturing/suppliers?limit=50`);
        if (!suppliersRes.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        const suppliersData = await suppliersRes.json();

        // Fetch procurement orders
        const ordersRes = await fetch(`/api/manufacturing/procurement?limit=50`);
        if (!ordersRes.ok) {
          throw new Error('Failed to fetch procurement orders');
        }
        const ordersData = await ordersRes.json();

        setSuppliers(suppliersData.suppliers || []);
        setProcurementOrders(ordersData.procurementOrders || []);
      } catch (err: any) {
        console.error('Supply chain data fetch error:', err);
        setError(err.message || 'Failed to load supply chain data');
      } finally {
        setLoading(false);
      }
    };

    fetchSupplyChainData();
  }, []);

  /**
   * Calculate summary statistics
   */
  const stats = React.useMemo(() => {
    const totalSuppliers = suppliers.length;
    const preferredSuppliers = suppliers.filter((s) => s.isPreferred).length;
    const avgPerformance =
      suppliers.length > 0
        ? suppliers.reduce((sum, s) => sum + (s.performance?.overallScore || 0), 0) / suppliers.length
        : 0;

    const totalOrders = procurementOrders.length;
    const activeOrders = procurementOrders.filter(
      (o) => !['Received', 'Cancelled'].includes(o.status)
    ).length;
    const overdueOrders = procurementOrders.filter(
      (o) =>
        o.expectedDelivery &&
        new Date(o.expectedDelivery) < new Date() &&
        !['Received', 'Cancelled'].includes(o.status)
    ).length;

    return {
      totalSuppliers,
      preferredSuppliers,
      avgPerformance,
      totalOrders,
      activeOrders,
      overdueOrders,
    };
  }, [suppliers, procurementOrders]);

  /**
   * Filter suppliers
   */
  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplierSearch === '' ||
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        supplier.supplierCode.toLowerCase().includes(supplierSearch.toLowerCase());

      const matchesTier = tierFilter === 'all' || supplier.tier === tierFilter;

      return matchesSearch && matchesTier;
    });
  }, [suppliers, supplierSearch, tierFilter]);

  /**
   * Filter procurement orders
   */
  const filteredOrders = React.useMemo(() => {
    return procurementOrders.filter((order) => {
      const matchesSearch =
        orderSearch === '' ||
        order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.supplier?.name.toLowerCase().includes(orderSearch.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [procurementOrders, orderSearch, statusFilter]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Heading size="lg" color="white">
            Supply Chain Management
          </Heading>
          <Spinner size="xl" color="picton_blue.500" />
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" bg="night.400" borderColor="red.500" borderWidth="1px" borderRadius="2xl">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" color="white" mb={2}>
              Supply Chain Management
            </Heading>
            <Text color="ash_gray.400">Supplier scorecards and procurement tracking</Text>
          </Box>
          <Button
            colorScheme="blue"
            onClick={() => router.push(`/companies/${unwrappedParams.id}/manufacturing`)}
          >
            Back to Dashboard
          </Button>
        </HStack>

        {/* Summary Statistics */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Total Suppliers</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {stats.totalSuppliers}
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">
                    {stats.preferredSuppliers} Preferred
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Avg Performance</StatLabel>
                  <StatNumber
                    color={stats.avgPerformance >= 90 ? 'green.400' : stats.avgPerformance >= 70 ? 'yellow.400' : 'red.400'}
                    fontSize="3xl"
                  >
                    {stats.avgPerformance.toFixed(0)}
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">/ 100</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Active Orders</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {stats.activeOrders}
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">/ {stats.totalOrders} Total</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card
              bg="night.400"
              borderColor={stats.overdueOrders > 0 ? 'red.500' : 'ash_gray.800'}
              borderWidth="1px"
              borderRadius="2xl"
            >
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Overdue Orders</StatLabel>
                  <StatNumber color={stats.overdueOrders > 0 ? 'red.400' : 'white'} fontSize="3xl">
                    {stats.overdueOrders}
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">Past expected delivery</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Suppliers and Orders Tabs */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab color="ash_gray.400" _selected={{ color: 'white', borderColor: 'picton_blue.500' }}>
              Suppliers ({filteredSuppliers.length})
            </Tab>
            <Tab color="ash_gray.400" _selected={{ color: 'white', borderColor: 'picton_blue.500' }}>
              Procurement Orders ({filteredOrders.length})
            </Tab>
          </TabList>

          <TabPanels>
            {/* Suppliers Tab */}
            <TabPanel px={0}>
              {/* Supplier Filters */}
              <HStack spacing={4} mb={4}>
                <Input
                  placeholder="Search suppliers..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  bg="night.400"
                  borderColor="ash_gray.800"
                  color="white"
                  _placeholder={{ color: 'ash_gray.500' }}
                />
                <Select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  bg="night.400"
                  borderColor="ash_gray.800"
                  color="white"
                  w="200px"
                >
                  <option value="all">All Tiers</option>
                  <option value="Tier1">Tier 1</option>
                  <option value="Tier2">Tier 2</option>
                  <option value="Tier3">Tier 3</option>
                </Select>
              </HStack>

              {/* Supplier Grid */}
              {filteredSuppliers.length === 0 ? (
                <Alert status="info" bg="night.400" borderColor="picton_blue.500" borderWidth="1px" borderRadius="2xl">
                  <AlertIcon />
                  <AlertDescription>No suppliers found matching your filters</AlertDescription>
                </Alert>
              ) : (
                <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
                  {filteredSuppliers.map((supplier) => (
                    <GridItem key={supplier._id}>
                      <SupplierCard
                        supplier={supplier}
                        onClick={(id: string) => router.push(`/companies/${unwrappedParams.id}/manufacturing/suppliers/${id}`)}
                      />
                    </GridItem>
                  ))}
                </Grid>
              )}
            </TabPanel>

            {/* Procurement Orders Tab */}
            <TabPanel px={0}>
              {/* Order Filters */}
              <HStack spacing={4} mb={4}>
                <Input
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  bg="night.400"
                  borderColor="ash_gray.800"
                  color="white"
                  _placeholder={{ color: 'ash_gray.500' }}
                />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  bg="night.400"
                  borderColor="ash_gray.800"
                  color="white"
                  w="200px"
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </Select>
              </HStack>

              {/* Orders Table */}
              <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th color="ash_gray.400">Order Number</Th>
                          <Th color="ash_gray.400">Supplier</Th>
                          <Th color="ash_gray.400">Status</Th>
                          <Th color="ash_gray.400">Approval</Th>
                          <Th color="ash_gray.400">Order Date</Th>
                          <Th color="ash_gray.400">Expected Delivery</Th>
                          <Th color="ash_gray.400" isNumeric>
                            Total Amount
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredOrders.map((order) => {
                          const isOverdue =
                            order.expectedDelivery &&
                            new Date(order.expectedDelivery) < new Date() &&
                            !['Received', 'Cancelled'].includes(order.status);
                          return (
                            <Tr
                              key={order._id}
                              _hover={{ bg: 'night.300' }}
                              bg={isOverdue ? 'red.900' : undefined}
                              opacity={isOverdue ? 0.9 : 1}
                            >
                              <Td color="white" fontWeight="medium">
                                {order.orderNumber}
                              </Td>
                              <Td color="white">{order.supplier?.name || 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme={getOrderStatusColor(order.status)} fontSize="xs">
                                  {order.status}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={getApprovalStatusColor(order.approvalStatus)} fontSize="xs">
                                  {order.approvalStatus}
                                </Badge>
                              </Td>
                              <Td color="ash_gray.400">
                                {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                              </Td>
                              <Td color={isOverdue ? 'red.400' : 'ash_gray.400'} fontWeight={isOverdue ? 'bold' : 'normal'}>
                                {order.expectedDelivery
                                  ? new Date(order.expectedDelivery).toLocaleDateString()
                                  : 'N/A'}
                                {isOverdue && <Text as="span" ml={1}>⚠</Text>}
                              </Td>
                              <Td color="white" isNumeric>
                                ${order.totalAmount?.toLocaleString() || '0'}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  {filteredOrders.length === 0 && (
                    <Box textAlign="center" py={8}>
                      <Text color="ash_gray.400">No orders found matching your filters</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

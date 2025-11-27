/**
 * @file app/(game)/companies/[id]/manufacturing/inventory/page.tsx
 * @description Inventory management page with material tracking and reorder alerts
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Inventory management dashboard displaying all inventory items with stock levels,
 * reorder alerts, ABC classification, and turnover analysis. Supports FIFO/LIFO/JIT
 * methods with quality status filtering and automated reorder point detection.
 * 
 * FEATURES:
 * - Inventory list with current quantities and valuation
 * - Reorder alerts (items at/below reorder point highlighted)
 * - ABC classification filtering (A: 80%, B: 15%, C: 5% of value)
 * - Quality status filtering (Available, Quarantine, Rejected, Reserved)
 * - Turnover rate display with color coding (>8: green, 4-8: yellow, <4: red)
 * - Inventory method badges (FIFO/LIFO/JIT)
 * - Total inventory value and item count
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Input,
  Select,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

/**
 * Get quality status color
 */
const getQualityStatusColor = (status: string): string => {
  switch (status) {
    case 'Available':
      return 'green';
    case 'Quarantine':
      return 'yellow';
    case 'Rejected':
      return 'red';
    case 'Reserved':
      return 'blue';
    default:
      return 'gray';
  }
};

/**
 * Get ABC classification color
 */
const getABCColor = (classification: string): string => {
  switch (classification) {
    case 'A':
      return 'red';
    case 'B':
      return 'yellow';
    case 'C':
      return 'green';
    default:
      return 'gray';
  }
};

/**
 * Get inventory method color
 */
const getInventoryMethodColor = (method: string): string => {
  switch (method) {
    case 'FIFO':
      return 'blue';
    case 'LIFO':
      return 'purple';
    case 'JIT':
      return 'orange';
    default:
      return 'gray';
  }
};

/**
 * Get turnover rate color (>8: excellent, 4-8: good, <4: poor)
 */
const getTurnoverColor = (rate: number): string => {
  if (rate > 8) return 'green.400';
  if (rate >= 4) return 'yellow.400';
  return 'red.400';
};

/**
 * Inventory management page component
 */
export default function InventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classificationFilter, setClassificationFilter] = useState('all');

  /**
   * Fetch inventory items
   */
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/manufacturing/inventory?limit=50`);
        if (!res.ok) {
          throw new Error('Failed to fetch inventory');
        }
        const data = await res.json();

        setInventory(data.inventory || []);
      } catch (err: any) {
        console.error('Inventory fetch error:', err);
        setError(err.message || 'Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  /**
   * Calculate summary statistics
   */
  const stats = React.useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const reorderAlerts = inventory.filter(
      (item) => item.quantityAvailable <= item.reorderPoint
    ).length;
    const avgTurnover =
      inventory.length > 0
        ? inventory.reduce((sum, item) => sum + (item.turnoverRate || 0), 0) / inventory.length
        : 0;

    return { totalItems, totalValue, reorderAlerts, avgTurnover };
  }, [inventory]);

  /**
   * Filter inventory items
   */
  const filteredInventory = React.useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.qualityStatus === statusFilter;

      const matchesClassification =
        classificationFilter === 'all' || item.abcClassification === classificationFilter;

      return matchesSearch && matchesStatus && matchesClassification;
    });
  }, [inventory, searchTerm, statusFilter, classificationFilter]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <Heading size="lg" color="white">
            Inventory Management
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
              Inventory Management
            </Heading>
            <Text color="ash_gray.400">Material tracking and reorder management</Text>
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
                  <StatLabel color="ash_gray.400">Total Items</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    {stats.totalItems}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Total Value</StatLabel>
                  <StatNumber color="white" fontSize="3xl">
                    ${stats.totalValue.toLocaleString()}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card
              bg="night.400"
              borderColor={stats.reorderAlerts > 0 ? 'red.500' : 'ash_gray.800'}
              borderWidth="1px"
              borderRadius="2xl"
            >
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Reorder Alerts</StatLabel>
                  <StatNumber color={stats.reorderAlerts > 0 ? 'red.400' : 'white'} fontSize="3xl">
                    {stats.reorderAlerts}
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">Items below reorder point</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
              <CardBody>
                <Stat>
                  <StatLabel color="ash_gray.400">Avg Turnover</StatLabel>
                  <StatNumber color={getTurnoverColor(stats.avgTurnover)} fontSize="3xl">
                    {stats.avgTurnover.toFixed(1)}x
                  </StatNumber>
                  <StatHelpText color="ash_gray.500">Per year</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Filters */}
        <HStack spacing={4}>
          <Input
            placeholder="Search by item name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <option value="Available">Available</option>
            <option value="Quarantine">Quarantine</option>
            <option value="Rejected">Rejected</option>
            <option value="Reserved">Reserved</option>
          </Select>
          <Select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            bg="night.400"
            borderColor="ash_gray.800"
            color="white"
            w="200px"
          >
            <option value="all">All Classes</option>
            <option value="A">Class A (High Value)</option>
            <option value="B">Class B (Medium Value)</option>
            <option value="C">Class C (Low Value)</option>
          </Select>
        </HStack>

        {/* Inventory Table */}
        <Card bg="night.400" borderColor="ash_gray.800" borderWidth="1px" borderRadius="2xl">
          <CardBody>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="ash_gray.400">Item</Th>
                    <Th color="ash_gray.400">Method</Th>
                    <Th color="ash_gray.400">Classification</Th>
                    <Th color="ash_gray.400" isNumeric>
                      Available
                    </Th>
                    <Th color="ash_gray.400" isNumeric>
                      Reorder Point
                    </Th>
                    <Th color="ash_gray.400">Status</Th>
                    <Th color="ash_gray.400" isNumeric>
                      Unit Cost
                    </Th>
                    <Th color="ash_gray.400" isNumeric>
                      Total Value
                    </Th>
                    <Th color="ash_gray.400" isNumeric>
                      Turnover
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredInventory.map((item) => {
                    const needsReorder = item.quantityAvailable <= item.reorderPoint;
                    return (
                      <Tr
                        key={item._id}
                        _hover={{ bg: 'night.300' }}
                        bg={needsReorder ? 'red.900' : undefined}
                        opacity={needsReorder ? 0.9 : 1}
                      >
                        <Td color="white">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{item.itemName}</Text>
                            <Text fontSize="xs" color="ash_gray.500">
                              {item.itemCode}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getInventoryMethodColor(item.inventoryMethod)} fontSize="xs">
                            {item.inventoryMethod}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getABCColor(item.abcClassification)} fontSize="xs">
                            Class {item.abcClassification}
                          </Badge>
                        </Td>
                        <Td color="white" isNumeric fontWeight={needsReorder ? 'bold' : 'normal'}>
                          {item.quantityAvailable.toLocaleString()}
                          {needsReorder && <Text as="span" color="red.400" ml={1}>⚠</Text>}
                        </Td>
                        <Td color="ash_gray.400" isNumeric>
                          {item.reorderPoint.toLocaleString()}
                        </Td>
                        <Td>
                          <Badge colorScheme={getQualityStatusColor(item.qualityStatus)} fontSize="xs">
                            {item.qualityStatus}
                          </Badge>
                        </Td>
                        <Td color="white" isNumeric>
                          ${item.unitCost.toFixed(2)}
                        </Td>
                        <Td color="white" isNumeric>
                          ${(item.totalValue || 0).toLocaleString()}
                        </Td>
                        <Td color={getTurnoverColor(item.turnoverRate || 0)} isNumeric fontWeight="medium">
                          {(item.turnoverRate || 0).toFixed(1)}x
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            {filteredInventory.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="ash_gray.400">
                  {searchTerm || statusFilter !== 'all' || classificationFilter !== 'all'
                    ? 'No items match your filters'
                    : 'No inventory items found'}
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}

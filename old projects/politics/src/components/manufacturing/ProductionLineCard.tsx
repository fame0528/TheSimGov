/**
 * @file src/components/manufacturing/ProductionLineCard.tsx
 * @description Production line display card with real-time status and OEE metrics
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Displays individual production line information including current status, shift schedule,
 * OEE breakdown (Availability × Performance × Quality), and capacity metrics. Supports
 * real-time status updates with color-coded indicators.
 * 
 * FEATURES:
 * - Status badge (Running: green, Idle: yellow, Maintenance: orange, Down: red)
 * - OEE breakdown with 3 components (Availability, Performance, Quality)
 * - Current shift display (1st/2nd/3rd shift)
 * - Throughput rate with target comparison
 * - Capacity utilization percentage
 * - Click handler for line details navigation
 */

'use client';

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  Progress,
  HStack,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Flex,
} from '@chakra-ui/react';

/**
 * Production line data structure
 */
interface ProductionLine {
  _id: string;
  name: string;
  lineNumber: string;
  status: 'Running' | 'Idle' | 'Maintenance' | 'Down';
  currentShift?: number; // 1, 2, or 3
  oee: {
    overall: number;
    availability: number;
    performance: number;
    quality: number;
  };
  capacity: {
    ratedCapacity: number;
    actualThroughput: number;
    utilization: number;
  };
  product?: string;
}

interface ProductionLineCardProps {
  line: ProductionLine;
  onClick?: (lineId: string) => void;
}

/**
 * Get status badge color scheme
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Running':
      return 'green';
    case 'Idle':
      return 'yellow';
    case 'Maintenance':
      return 'orange';
    case 'Down':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get OEE component color (>95% green, 85-95% yellow, <85% red)
 */
const getOEEComponentColor = (value: number): string => {
  if (value >= 95) return 'green';
  if (value >= 85) return 'yellow';
  return 'red';
};

/**
 * ProductionLineCard Component
 * Displays production line with real-time status and metrics
 */
export const ProductionLineCard: React.FC<ProductionLineCardProps> = ({ line, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(line._id);
    }
  };

  return (
    <Card
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="ash_gray.800"
      bg="night.400"
      _hover={{
        borderColor: 'picton_blue.500',
        transform: 'translateY(-2px)',
        shadow: 'lg',
        cursor: onClick ? 'pointer' : 'default',
      }}
      transition="all 0.2s"
      onClick={handleClick}
    >
      <CardHeader pb={2}>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Heading size="md" color="white">
              {line.name}
            </Heading>
            <Text fontSize="sm" color="ash_gray.400">
              Line {line.lineNumber}
            </Text>
          </VStack>
          <VStack align="end" spacing={1}>
            <Badge colorScheme={getStatusColor(line.status)} fontSize="sm">
              {line.status}
            </Badge>
            {line.currentShift && (
              <Text fontSize="xs" color="ash_gray.400">
                Shift {line.currentShift}
              </Text>
            )}
          </VStack>
        </Flex>
      </CardHeader>

      <CardBody pt={2}>
        <VStack spacing={4} align="stretch">
          {/* Current Product */}
          {line.product && (
            <Box>
              <Text fontSize="xs" color="ash_gray.400" mb={1}>
                Current Product
              </Text>
              <Text fontSize="sm" color="white" fontWeight="medium">
                {line.product}
              </Text>
            </Box>
          )}

          {/* Overall OEE */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" color="ash_gray.400">
                Overall OEE
              </Text>
              <Text fontSize="lg" fontWeight="bold" color={`${getOEEComponentColor(line.oee.overall)}.400`}>
                {line.oee.overall.toFixed(1)}%
              </Text>
            </HStack>
            <Progress
              value={line.oee.overall}
              colorScheme={getOEEComponentColor(line.oee.overall)}
              borderRadius="md"
              size="sm"
            />
          </Box>

          {/* OEE Breakdown */}
          <Grid templateColumns="repeat(3, 1fr)" gap={2}>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Availability
                </StatLabel>
                <StatNumber fontSize="md" color={`${getOEEComponentColor(line.oee.availability)}.400`}>
                  {line.oee.availability.toFixed(1)}%
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Performance
                </StatLabel>
                <StatNumber fontSize="md" color={`${getOEEComponentColor(line.oee.performance)}.400`}>
                  {line.oee.performance.toFixed(1)}%
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Quality
                </StatLabel>
                <StatNumber fontSize="md" color={`${getOEEComponentColor(line.oee.quality)}.400`}>
                  {line.oee.quality.toFixed(1)}%
                </StatNumber>
              </Stat>
            </GridItem>
          </Grid>

          {/* Capacity and Throughput */}
          <HStack spacing={4}>
            <Stat flex={1}>
              <StatLabel fontSize="xs" color="ash_gray.400">
                Throughput
              </StatLabel>
              <StatNumber fontSize="lg" color="white">
                {line.capacity.actualThroughput.toLocaleString()}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                / {line.capacity.ratedCapacity.toLocaleString()} units/hr
              </StatHelpText>
            </Stat>

            <Stat flex={1}>
              <StatLabel fontSize="xs" color="ash_gray.400">
                Utilization
              </StatLabel>
              <StatNumber fontSize="lg" color="white">
                {line.capacity.utilization.toFixed(1)}%
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Capacity
              </StatHelpText>
            </Stat>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ProductionLineCard;

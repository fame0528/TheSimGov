/**
 * @file src/components/manufacturing/SupplierCard.tsx
 * @description Supplier vendor display card with performance scorecard metrics
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Displays supplier vendor information with performance scorecard including on-time
 * delivery rate, quality rating, price competitiveness, and overall score. Supports
 * multi-tier supply chain (Tier 1/2/3) with tier-specific badges and preferred
 * supplier indicators.
 * 
 * FEATURES:
 * - Supplier tier badge (Tier1: blue, Tier2: green, Tier3: yellow)
 * - Performance tier indicator (Excellent/Good/Fair/Poor)
 * - Overall score with color coding (>90: green, 70-90: yellow, <70: red)
 * - 4 key metrics: On-time delivery, Quality rating, Price competitiveness, Responsiveness
 * - Preferred supplier star indicator
 * - Total spend tracking
 * - Click handler for supplier details navigation
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
  HStack,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  GridItem,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FaStar, FaDollarSign } from 'react-icons/fa';

/**
 * Supplier data structure
 */
interface Supplier {
  _id: string;
  name: string;
  supplierCode: string;
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  category: string;
  performanceTier: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  isPreferred: boolean;
  performance: {
    overallScore: number; // 0-100
    onTimeDeliveryRate: number; // Percentage
    qualityRating: number; // 0-100
    priceCompetitiveness: number; // 0-100
    responsiveness: number; // 0-100
  };
  totalSpend?: number;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

interface SupplierCardProps {
  supplier: Supplier;
  onClick?: (supplierId: string) => void;
}

/**
 * Get supplier tier color
 */
const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'Tier1':
      return 'blue';
    case 'Tier2':
      return 'green';
    case 'Tier3':
      return 'yellow';
    default:
      return 'gray';
  }
};

/**
 * Get performance tier color
 */
const getPerformanceTierColor = (tier: string): string => {
  switch (tier) {
    case 'Excellent':
      return 'green';
    case 'Good':
      return 'blue';
    case 'Fair':
      return 'yellow';
    case 'Poor':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get overall score color
 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return 'green';
  if (score >= 70) return 'yellow';
  return 'red';
};

/**
 * Get metric color (>90: green, 70-90: yellow, <70: red)
 */
const getMetricColor = (value: number): string => {
  if (value >= 90) return 'green.400';
  if (value >= 70) return 'yellow.400';
  return 'red.400';
};

/**
 * SupplierCard Component
 * Displays supplier with performance scorecard
 */
export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(supplier._id);
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
            <HStack spacing={2}>
              <Heading size="md" color="white">
                {supplier.name}
              </Heading>
              {supplier.isPreferred && (
                <Icon as={FaStar} color="gold.500" boxSize={4} />
              )}
            </HStack>
            <Text fontSize="sm" color="ash_gray.400">
              {supplier.supplierCode}
            </Text>
          </VStack>
          <VStack align="end" spacing={1}>
            <Badge colorScheme={getTierColor(supplier.tier)} fontSize="sm">
              {supplier.tier}
            </Badge>
            <Badge colorScheme={getPerformanceTierColor(supplier.performanceTier)} fontSize="xs">
              {supplier.performanceTier}
            </Badge>
          </VStack>
        </Flex>
      </CardHeader>

      <CardBody pt={2}>
        <VStack spacing={4} align="stretch">
          {/* Category and Location */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="ash_gray.400">
              {supplier.category}
            </Text>
            {supplier.location && (
              <Text fontSize="xs" color="ash_gray.500">
                {supplier.location.city}, {supplier.location.country}
              </Text>
            )}
          </HStack>

          {/* Overall Score */}
          <Box textAlign="center" py={2}>
            <Text fontSize="xs" color="ash_gray.400" mb={1}>
              Overall Score
            </Text>
            <Text fontSize="3xl" fontWeight="bold" color={`${getScoreColor(supplier.performance.overallScore)}.400`}>
              {supplier.performance.overallScore.toFixed(0)}
            </Text>
            <Text fontSize="xs" color="ash_gray.500">
              / 100
            </Text>
          </Box>

          {/* Performance Metrics */}
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  On-Time Delivery
                </StatLabel>
                <StatNumber fontSize="lg" color={getMetricColor(supplier.performance.onTimeDeliveryRate)}>
                  {supplier.performance.onTimeDeliveryRate.toFixed(1)}%
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Quality Rating
                </StatLabel>
                <StatNumber fontSize="lg" color={getMetricColor(supplier.performance.qualityRating)}>
                  {supplier.performance.qualityRating.toFixed(0)}
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Price Comp.
                </StatLabel>
                <StatNumber fontSize="lg" color={getMetricColor(supplier.performance.priceCompetitiveness)}>
                  {supplier.performance.priceCompetitiveness.toFixed(0)}
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size="sm">
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Responsiveness
                </StatLabel>
                <StatNumber fontSize="lg" color={getMetricColor(supplier.performance.responsiveness)}>
                  {supplier.performance.responsiveness.toFixed(0)}
                </StatNumber>
              </Stat>
            </GridItem>
          </Grid>

          {/* Total Spend */}
          {supplier.totalSpend !== undefined && (
            <HStack spacing={2} justify="center" pt={2} borderTop="1px" borderColor="ash_gray.800">
              <Icon as={FaDollarSign} color="gold.500" boxSize={4} />
              <Text fontSize="sm" color="white" fontWeight="medium">
                ${supplier.totalSpend.toLocaleString()} Total Spend
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default SupplierCard;

/**
 * @file src/components/manufacturing/FacilityCard.tsx
 * @description Manufacturing facility display card with capacity and OEE metrics
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Displays individual manufacturing facility information including facility type,
 * location, capacity metrics, OEE (Overall Equipment Effectiveness), and production
 * line count. Supports 3 facility types (Discrete, Process, Assembly) with
 * type-specific visual indicators.
 * 
 * FEATURES:
 * - Facility type badge with color coding (Discrete: blue, Process: green, Assembly: gold)
 * - Capacity utilization percentage with color-coded progress bar
 * - OEE percentage display (color-coded: >85% green, 70-85% yellow, <70% red)
 * - Production line count with active/total breakdown
 * - Location and size display (square footage)
 * - Click handler for navigation to facility details
 * - Automation level indicator (1-10 scale)
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
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaRulerCombined, FaRobot } from 'react-icons/fa';

/**
 * Manufacturing facility data structure
 */
interface Facility {
  _id: string;
  name: string;
  facilityCode: string;
  facilityType: 'Discrete' | 'Process' | 'Assembly';
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  size: number; // Square footage
  automationLevel: number; // 1-10 scale
  capacity: {
    designCapacity: number;
    effectiveCapacity: number;
    utilization: number; // Percentage
  };
  oee?: number; // Overall Equipment Effectiveness percentage
  productionLineCount?: number;
  activeProductionLines?: number;
}

interface FacilityCardProps {
  facility: Facility;
  onClick?: (facilityId: string) => void;
}

/**
 * Get facility type badge color
 */
const getFacilityTypeColor = (type: string): string => {
  switch (type) {
    case 'Discrete':
      return 'blue';
    case 'Process':
      return 'green';
    case 'Assembly':
      return 'yellow';
    default:
      return 'gray';
  }
};

/**
 * Get OEE color based on percentage (World Class: >85%, Good: 70-85%, Poor: <70%)
 */
const getOEEColor = (oee: number): string => {
  if (oee >= 85) return 'green';
  if (oee >= 70) return 'yellow';
  return 'red';
};

/**
 * Get capacity utilization color
 */
const getUtilizationColor = (utilization: number): string => {
  if (utilization >= 90) return 'red'; // Over-capacity warning
  if (utilization >= 75) return 'yellow';
  return 'green';
};

/**
 * FacilityCard Component
 * Displays manufacturing facility with metrics and status
 */
export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(facility._id);
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
              {facility.name}
            </Heading>
            <Text fontSize="sm" color="ash_gray.400">
              {facility.facilityCode}
            </Text>
          </VStack>
          <Badge colorScheme={getFacilityTypeColor(facility.facilityType)} fontSize="sm">
            {facility.facilityType}
          </Badge>
        </Flex>
      </CardHeader>

      <CardBody pt={2}>
        <VStack spacing={4} align="stretch">
          {/* Location */}
          <HStack spacing={2}>
            <Icon as={FaMapMarkerAlt} color="ash_gray.400" />
            <Text fontSize="sm" color="ash_gray.300">
              {facility.location.city}, {facility.location.state}
            </Text>
          </HStack>

          {/* Capacity Metrics */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" color="ash_gray.400">
                Capacity Utilization
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="white">
                {facility.capacity.utilization.toFixed(1)}%
              </Text>
            </HStack>
            <Progress
              value={facility.capacity.utilization}
              colorScheme={getUtilizationColor(facility.capacity.utilization)}
              borderRadius="md"
              size="sm"
            />
            <HStack justify="space-between" mt={1}>
              <Text fontSize="xs" color="ash_gray.500">
                Effective: {facility.capacity.effectiveCapacity.toLocaleString()} units
              </Text>
            </HStack>
          </Box>

          {/* OEE and Production Lines */}
          <HStack spacing={4}>
            {facility.oee !== undefined && (
              <Stat flex={1}>
                <StatLabel fontSize="xs" color="ash_gray.400">
                  OEE
                </StatLabel>
                <StatNumber fontSize="2xl" color={`${getOEEColor(facility.oee)}.400`}>
                  {facility.oee.toFixed(1)}%
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>
                  {facility.oee >= 85 ? 'World Class' : facility.oee >= 70 ? 'Good' : 'Needs Improvement'}
                </StatHelpText>
              </Stat>
            )}

            {facility.productionLineCount !== undefined && (
              <Stat flex={1}>
                <StatLabel fontSize="xs" color="ash_gray.400">
                  Production Lines
                </StatLabel>
                <StatNumber fontSize="2xl" color="white">
                  {facility.activeProductionLines || 0}/{facility.productionLineCount}
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>
                  Active
                </StatHelpText>
              </Stat>
            )}
          </HStack>

          {/* Size and Automation */}
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={FaRulerCombined} color="ash_gray.400" boxSize={3} />
              <Text fontSize="xs" color="ash_gray.400">
                {facility.size.toLocaleString()} sq ft
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Icon as={FaRobot} color="ash_gray.400" boxSize={3} />
              <Text fontSize="xs" color="ash_gray.400">
                Automation: {facility.automationLevel}/10
              </Text>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default FacilityCard;

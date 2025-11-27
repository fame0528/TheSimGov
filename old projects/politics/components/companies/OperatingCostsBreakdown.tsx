/**
 * @file components/companies/OperatingCostsBreakdown.tsx
 * @description Operating costs breakdown display with visual indicators
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Displays monthly operating costs by category with progress bars and
 * financial health indicators. Shows cash burn rate and runway projections.
 * 
 * USAGE:
 * ```tsx
 * <OperatingCostsBreakdown company={company} />
 * ```
 */

'use client';

import { Box, Text, Progress, Badge, VStack, HStack, Grid, GridItem } from '@chakra-ui/react';
import type { ICompany } from '@/lib/db/models/Company';
import { 
  getMonthlyOperatingCosts, 
  calculateCashBurnRate,
  forecastMonthsRemaining,
  getCostBreakdownPercentages 
} from '@/lib/utils/operatingCosts';
import { getFinancialHealthStatus } from '@/lib/utils/financialHealth';

interface OperatingCostsBreakdownProps {
  company: ICompany;
}

/**
 * Format currency with K/M suffixes for readability
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Get color scheme based on financial health status
 */
function getHealthColor(status: string): string {
  switch (status) {
    case 'excellent': return 'green';
    case 'good': return 'blue';
    case 'fair': return 'yellow';
    case 'warning': return 'orange';
    case 'critical': return 'red';
    default: return 'gray';
  }
}

/**
 * Get progress bar color based on percentage of total
 */
function getCostCategoryColor(percentage: number): string {
  if (percentage > 40) return 'red';
  if (percentage > 25) return 'orange';
  if (percentage > 15) return 'yellow';
  return 'green';
}

export default function OperatingCostsBreakdown({ company }: OperatingCostsBreakdownProps) {
  const costs = getMonthlyOperatingCosts(company);
  const healthStatus = getFinancialHealthStatus(company);
  
  if (!costs) {
    return (
      <Box>
        <Text color="red.400">Unable to load operating costs for this company level.</Text>
      </Box>
    );
  }

  const percentages = getCostBreakdownPercentages(costs);
  const burnRate = calculateCashBurnRate(company, costs);
  const monthsRemaining = forecastMonthsRemaining(company.cash, burnRate);

  const costCategories = [
    { name: 'Salaries', value: costs.salaries, percentage: percentages.salaries },
    { name: 'Facilities', value: costs.facilities, percentage: percentages.facilities },
    { name: 'Marketing', value: costs.marketing, percentage: percentages.marketing },
    { name: 'Compliance', value: costs.compliance, percentage: percentages.compliance },
    { name: 'R&D', value: costs.rAndD, percentage: percentages.rAndD },
    { name: 'Overhead', value: costs.overhead, percentage: percentages.overhead },
  ];

  return (
    <VStack spacing={6} align="stretch">
      {/* Financial Health Badge */}
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="bold" color="white">
          Monthly Operating Costs
        </Text>
        <Badge
          colorScheme={getHealthColor(healthStatus.status)}
          fontSize="md"
          px={3}
          py={1}
          borderRadius="md"
        >
          {healthStatus.status.toUpperCase()}
        </Badge>
      </HStack>

      {/* Total Costs Summary */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        <GridItem>
          <Box bg="gray.800" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
            <Text fontSize="sm" color="gray.400" mb={1}>
              Total Monthly Costs
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {formatCurrency(costs.total)}
            </Text>
          </Box>
        </GridItem>
        
        <GridItem>
          <Box bg="gray.800" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
            <Text fontSize="sm" color="gray.400" mb={1}>
              Cash Burn Rate
            </Text>
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color={burnRate >= 0 ? 'green.400' : 'red.400'}
            >
              {burnRate >= 0 ? '+' : ''}{formatCurrency(burnRate)}
            </Text>
          </Box>
        </GridItem>
        
        <GridItem>
          <Box bg="gray.800" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
            <Text fontSize="sm" color="gray.400" mb={1}>
              Runway Remaining
            </Text>
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color={
                monthsRemaining === Infinity 
                  ? 'green.400' 
                  : monthsRemaining < 3 
                    ? 'red.400' 
                    : monthsRemaining < 6 
                      ? 'orange.400' 
                      : 'white'
              }
            >
              {monthsRemaining === Infinity ? '∞' : `${monthsRemaining.toFixed(1)}mo`}
            </Text>
          </Box>
        </GridItem>
      </Grid>

      {/* Cost Categories Breakdown */}
      <Box>
        <Text fontSize="md" fontWeight="semibold" color="white" mb={3}>
          Cost Breakdown by Category
        </Text>
        <VStack spacing={3} align="stretch">
          {costCategories.map((category) => (
            <Box key={category.name}>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" color="gray.300">
                  {category.name}
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.400">
                    {category.percentage.toFixed(1)}%
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="white">
                    {formatCurrency(category.value)}
                  </Text>
                </HStack>
              </HStack>
              <Progress
                value={category.percentage}
                colorScheme={getCostCategoryColor(category.percentage)}
                size="sm"
                borderRadius="md"
              />
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Financial Health Warnings */}
      {healthStatus.warnings.length > 0 && (
        <Box bg="orange.900" borderColor="orange.600" borderWidth="1px" p={4} borderRadius="lg">
          <Text fontSize="sm" fontWeight="bold" color="orange.200" mb={2}>
            ⚠️ Financial Warnings
          </Text>
          <VStack align="stretch" spacing={1}>
            {healthStatus.warnings.map((warning, index) => (
              <Text key={index} fontSize="sm" color="orange.100">
                • {warning}
              </Text>
            ))}
          </VStack>
        </Box>
      )}

      {/* Recommendations */}
      {healthStatus.recommendations.length > 0 && (
        <Box bg="blue.900" borderColor="blue.600" borderWidth="1px" p={4} borderRadius="lg">
          <Text fontSize="sm" fontWeight="bold" color="blue.200" mb={2}>
            💡 Recommendations
          </Text>
          <VStack align="stretch" spacing={1}>
            {healthStatus.recommendations.map((rec, index) => (
              <Text key={index} fontSize="sm" color="blue.100">
                • {rec}
              </Text>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}

/**
 * @file components/companies/CompanyCard.tsx
 * @description Company display card with financial stats and quick actions
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Reusable component for displaying company information in card format.
 * Shows company name, industry, financial metrics (cash, revenue, expenses, P&L),
 * and employee count. Includes click handler for navigation to company dashboard.
 * 
 * FEATURES:
 * - Industry badge with color coding
 * - Financial stats with formatting (commas, dollar signs)
 * - Profit/loss indicator with color (green positive, red negative)
 * - Founded date display
 * - Hover effect for interactivity
 * - Click-to-view company details
 * 
 * USAGE:
 * ```typescript
 * import CompanyCard from '@/components/companies/CompanyCard';
 * 
 * <CompanyCard 
 *   company={company} 
 *   onClick={() => router.push(`/companies/${company._id}`)}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Uses Chakra UI for consistent styling
 * - Integrates custom color palette
 * - Formats currency with commas and $ prefix
 * - Displays profit/loss with appropriate colors
 * - Industry badges use industry-specific colors
 */

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Grid,
  GridItem,
  Tooltip,
} from '@chakra-ui/react';
import type { ICompany } from '@/lib/db/models/Company';
import { INDUSTRY_INFO } from '@/lib/constants/industries';

/**
 * CompanyCard props interface
 * 
 * @interface CompanyCardProps
 * @property {ICompany} company - Company data to display
 * @property {function} [onClick] - Optional click handler for navigation
 */
interface CompanyCardProps {
  company: ICompany & { netWorth?: number; profitLoss?: number };
  onClick?: () => void;
}

/**
 * Format currency with commas and dollar sign
 * 
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(10000) // '$10,000'
 * formatCurrency(-5000) // '-$5,000'
 */
const formatCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formatted = absoluteAmount.toLocaleString('en-US');
  return isNegative ? `-$${formatted}` : `$${formatted}`;
};

/**
 * Get industry badge color based on risk level
 * 
 * @param {string} industry - Industry name
 * @returns {string} Chakra color scheme
 */
const getIndustryColor = (industry: string): string => {
  const risk = INDUSTRY_INFO[industry as keyof typeof INDUSTRY_INFO]?.risk || 'Medium';
  switch (risk) {
    case 'High':
      return 'red';
    case 'Medium':
      return 'yellow';
    case 'Low':
      return 'green';
    default:
      return 'gray';
  }
};

/**
 * CompanyCard component
 * 
 * @description
 * Card displaying company information with financial metrics.
 * 
 * @param {CompanyCardProps} props - Component props
 * @returns {JSX.Element} Rendered company card
 * 
 * @example
 * ```tsx
 * <CompanyCard 
 *   company={company} 
 *   onClick={() => router.push(`/companies/${company._id}`)}
 * />
 * ```
 */
export default function CompanyCard({ company, onClick }: CompanyCardProps) {
  // Calculate profit/loss if not provided as virtual
  const profitLoss = company.profitLoss ?? (company.revenue - company.expenses);
  const netWorth = company.netWorth ?? company.cash;

  return (
    <Box
      bg="night.400"
      borderRadius="2xl"
      border="1px solid"
      borderColor="ash_gray.800"
      p={5}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.2s"
      _hover={
        onClick
          ? {
              borderColor: 'picton_blue.500',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 174, 243, 0.15)',
            }
          : {}
      }
    >
      <VStack align="stretch" spacing={4}>
        {/* Company Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Text color="white" fontSize="xl" fontWeight="bold">
              {company.name}
            </Text>
            <Text color="ash_gray.400" fontSize="sm">
              Founded {new Date(company.foundedAt).toLocaleDateString()}
            </Text>
          </VStack>
          <Tooltip label={INDUSTRY_INFO[company.industry]?.description} placement="top" hasArrow>
            <Badge colorScheme={getIndustryColor(company.industry)} fontSize="sm" px={3} py={1}>
              {company.industry}
            </Badge>
          </Tooltip>
        </HStack>

        <Divider borderColor="ash_gray.800" />

        {/* Financial Stats Grid */}
        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          {/* Cash */}
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase">
                Cash
              </Text>
              <Text color="gold.500" fontSize="lg" fontWeight="bold">
                {formatCurrency(company.cash)}
              </Text>
            </VStack>
          </GridItem>

          {/* Net Worth */}
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase">
                Net Worth
              </Text>
              <Text color="gold.500" fontSize="lg" fontWeight="bold">
                {formatCurrency(netWorth)}
              </Text>
            </VStack>
          </GridItem>

          {/* Revenue */}
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase">
                Revenue
              </Text>
              <Text color="white" fontSize="md" fontWeight="semibold">
                {formatCurrency(company.revenue)}
              </Text>
            </VStack>
          </GridItem>

          {/* Expenses */}
          <GridItem>
            <VStack align="start" spacing={1}>
              <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase">
                Expenses
              </Text>
              <Text color="white" fontSize="md" fontWeight="semibold">
                {formatCurrency(company.expenses)}
              </Text>
            </VStack>
          </GridItem>
        </Grid>

        <Divider borderColor="ash_gray.800" />

        {/* Bottom Stats */}
        <HStack justify="space-between">
          {/* Profit/Loss */}
          <VStack align="start" spacing={1}>
            <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase">
              Profit/Loss
            </Text>
            <Text
              color={profitLoss >= 0 ? 'green.400' : 'red_cmyk.500'}
              fontSize="md"
              fontWeight="bold"
            >
              {profitLoss >= 0 ? '+' : ''}
              {formatCurrency(profitLoss)}
            </Text>
          </VStack>

          {/* Employees */}
          <VStack align="end" spacing={1}>
            <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase">
              Employees
            </Text>
            <Text color="white" fontSize="md" fontWeight="bold">
              {company.employees}
            </Text>
          </VStack>
        </HStack>

        {/* Mission Statement (if present) */}
        {company.mission && (
          <>
            <Divider borderColor="ash_gray.800" />
            <Box>
              <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                Mission
              </Text>
              <Text color="ash_gray.300" fontSize="sm" fontStyle="italic">
                "{company.mission}"
              </Text>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
}

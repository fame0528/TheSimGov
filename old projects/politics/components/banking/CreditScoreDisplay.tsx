/**
 * @file components/banking/CreditScoreDisplay.tsx
 * @description Credit score visualization with factor breakdown
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Displays company credit score (300-850 FICO-like) with visual gauge,
 * rating badge, and detailed factor breakdown. Shows recommendations
 * for improving credit score.
 * 
 * FEATURES:
 * - Credit score gauge visualization
 * - Color-coded rating badge
 * - Factor breakdown with scores
 * - Improvement recommendations
 * - Historical score trend
 * 
 * USAGE:
 * ```tsx
 * import CreditScoreDisplay from '@/components/banking/CreditScoreDisplay';
 * 
 * <CreditScoreDisplay companyId={companyId} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  List,
  ListItem,
  ListIcon,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

interface CreditScoreDisplayProps {
  companyId: string;
}

interface CreditScoreData {
  score: number;
  rating: string;
  factors: {
    paymentHistoryScore: number;
    debtScore: number;
    ageScore: number;
    mixScore: number;
    inquiryScore: number;
  };
  recommendations: string[];
}

export default function CreditScoreDisplay({ companyId }: CreditScoreDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState<CreditScoreData | null>(null);

  useEffect(() => {
    const fetchCreditScore = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/companies/${companyId}/credit-score`);
        if (res.ok) {
          const data = await res.json();
          setCreditData(data);
        }
      } catch (error) {
        console.error('Error fetching credit score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditScore();
  }, [companyId]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Exceptional':
        return 'green';
      case 'VeryGood':
        return 'teal';
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

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'green.500';
    if (score >= 740) return 'teal.500';
    if (score >= 670) return 'blue.500';
    if (score >= 580) return 'yellow.500';
    return 'red.500';
  };

  const getFactorPercentage = (score: number, maxScore: number) => {
    return (score / maxScore) * 100;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading credit score...</Text>
      </Box>
    );
  }

  if (!creditData) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load credit score data.
      </Alert>
    );
  }

  const { score, rating, factors, recommendations } = creditData;

  return (
    <VStack spacing={6} align="stretch">
      {/* Credit Score Gauge */}
      <Box textAlign="center" p={6} bg="gray.50" borderRadius="lg">
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Credit Score
        </Text>
        <Text fontSize="6xl" fontWeight="bold" color={getScoreColor(score)}>
          {score}
        </Text>
        <Badge colorScheme={getRatingColor(rating)} fontSize="lg" px={4} py={1} borderRadius="full">
          {rating.replace(/([A-Z])/g, ' $1').trim()}
        </Badge>
        <Progress
          value={((score - 300) / (850 - 300)) * 100}
          colorScheme={getRatingColor(rating)}
          size="lg"
          mt={4}
          borderRadius="full"
        />
        <HStack justify="space-between" mt={2} fontSize="sm" color="gray.600">
          <Text>300</Text>
          <Text>850</Text>
        </HStack>
      </Box>

      <Divider />

      {/* Score Range Guide */}
      <Box>
        <Text fontWeight="bold" mb={3}>
          Score Ranges
        </Text>
        <VStack spacing={2} align="stretch">
          <HStack>
            <Badge colorScheme="green" w="120px">800-850</Badge>
            <Text fontSize="sm">Exceptional - Best rates, 98% approval</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="teal" w="120px">740-799</Badge>
            <Text fontSize="sm">Very Good - Excellent rates, 90% approval</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="blue" w="120px">670-739</Badge>
            <Text fontSize="sm">Good - Competitive rates, 75% approval</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="yellow" w="120px">580-669</Badge>
            <Text fontSize="sm">Fair - Higher rates, 50% approval</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="red" w="120px">300-579</Badge>
            <Text fontSize="sm">Poor - Very high rates, 20% approval</Text>
          </HStack>
        </VStack>
      </Box>

      <Divider />

      {/* Factor Breakdown */}
      <Box>
        <Text fontWeight="bold" mb={4}>
          Score Factors
        </Text>
        <VStack spacing={4} align="stretch">
          {/* Payment History - 35% */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium">Payment History (35%)</Text>
              <Text fontSize="sm" fontWeight="bold">{factors.paymentHistoryScore} / 297</Text>
            </HStack>
            <Progress
              value={getFactorPercentage(factors.paymentHistoryScore, 297)}
              colorScheme={factors.paymentHistoryScore >= 250 ? 'green' : factors.paymentHistoryScore >= 200 ? 'yellow' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>

          {/* Debt-to-Equity - 30% */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium">Debt-to-Equity Ratio (30%)</Text>
              <Text fontSize="sm" fontWeight="bold">{factors.debtScore} / 255</Text>
            </HStack>
            <Progress
              value={getFactorPercentage(factors.debtScore, 255)}
              colorScheme={factors.debtScore >= 220 ? 'green' : factors.debtScore >= 180 ? 'yellow' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>

          {/* Credit Age - 15% */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium">Credit Age (15%)</Text>
              <Text fontSize="sm" fontWeight="bold">{factors.ageScore} / 127</Text>
            </HStack>
            <Progress
              value={getFactorPercentage(factors.ageScore, 127)}
              colorScheme={factors.ageScore >= 100 ? 'green' : factors.ageScore >= 75 ? 'yellow' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>

          {/* Credit Mix - 10% */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium">Credit Mix (10%)</Text>
              <Text fontSize="sm" fontWeight="bold">{factors.mixScore} / 85</Text>
            </HStack>
            <Progress
              value={getFactorPercentage(factors.mixScore, 85)}
              colorScheme={factors.mixScore >= 70 ? 'green' : factors.mixScore >= 50 ? 'yellow' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>

          {/* Recent Inquiries - 10% */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium">Recent Inquiries (10%)</Text>
              <Text fontSize="sm" fontWeight="bold">{factors.inquiryScore} / 85</Text>
            </HStack>
            <Progress
              value={getFactorPercentage(factors.inquiryScore, 85)}
              colorScheme={factors.inquiryScore >= 70 ? 'green' : factors.inquiryScore >= 50 ? 'yellow' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>
        </VStack>
      </Box>

      <Divider />

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Box>
          <Text fontWeight="bold" mb={3}>
            Recommendations to Improve Score
          </Text>
          <List spacing={2}>
            {recommendations.map((rec, idx) => (
              <ListItem key={idx} fontSize="sm">
                <ListIcon as={score >= 670 ? CheckCircleIcon : WarningIcon} color={score >= 670 ? 'green.500' : 'yellow.500'} />
                {rec}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Impact Summary */}
      <Box p={4} bg="blue.50" borderRadius="md">
        <Text fontWeight="bold" mb={2}>
          What This Means
        </Text>
        <VStack spacing={2} align="stretch" fontSize="sm">
          <HStack>
            <Text fontWeight="medium">Loan Approval:</Text>
            <Text>
              {score >= 740 ? '90%+ approval rate' : score >= 670 ? '75% approval rate' : score >= 580 ? '50% approval rate' : '20% approval rate'}
            </Text>
          </HStack>
          <HStack>
            <Text fontWeight="medium">Interest Rates:</Text>
            <Text>
              {score >= 800 ? 'Best rates (base - 1.5%)' : score >= 740 ? 'Excellent rates (base - 0.5%)' : score >= 670 ? 'Competitive rates (base)' : score >= 580 ? 'Higher rates (base + 2%)' : 'Very high rates (base + 5%)'}
            </Text>
          </HStack>
          <HStack>
            <Text fontWeight="medium">Collateral:</Text>
            <Text>
              {score >= 670 ? 'May not be required' : 'Likely required (130-150% of loan amount)'}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  );
}

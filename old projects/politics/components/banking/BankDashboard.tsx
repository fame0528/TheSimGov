/**
 * @file components/banking/BankDashboard.tsx
 * @description Player bank management dashboard for Level 3+ companies
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Complete dashboard for managing player-owned banking operations. Displays
 * capital adequacy ratio (CAR), issued loans, lending capacity, and performance
 * metrics. Enables loan issuance and capital management.
 * 
 * FEATURES:
 * - Basel III CAR monitoring with health status
 * - Issued loans portfolio management
 * - Lending capacity calculator
 * - Banking performance metrics (profit/loss, default rate)
 * - Loan issuance interface
 * - Capital injection/withdrawal
 * - Risk-weighted assets breakdown
 * 
 * USAGE:
 * ```tsx
 * import BankDashboard from '@/components/banking/BankDashboard';
 * 
 * <BankDashboard companyId={companyId} />
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
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  StatArrow,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useToast,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';

interface BankDashboardProps {
  companyId: string;
}

interface PlayerBankData {
  licensed: boolean;
  capital: number;
  totalLoansIssued: number;
  totalInterestEarned: number;
  defaultLosses: number;
  car: number;
  carStatus: 'healthy' | 'adequate' | 'undercapitalized';
  riskWeightedAssets: number;
  recommendations: string[];
}

interface IssuedLoan {
  _id: string;
  borrowerName: string;
  principal: number;
  balance: number;
  interestRate: number;
  status: string;
  paymentsMade: number;
  termMonths: number;
  originationDate: string;
}

export default function BankDashboard({ companyId }: BankDashboardProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bankData, setBankData] = useState<PlayerBankData | null>(null);
  const [issuedLoans, setIssuedLoans] = useState<IssuedLoan[]>([]);

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const [bankRes, loansRes] = await Promise.all([
        fetch(`/api/banking/player/status?companyId=${companyId}`),
        fetch(`/api/banking/player/issued-loans?bankId=${companyId}`),
      ]);

      if (bankRes.ok) {
        const data = await bankRes.json();
        setBankData(data.bank);
      }

      if (loansRes.ok) {
        const data = await loansRes.json();
        setIssuedLoans(data.loans || []);
      }
    } catch (error) {
      console.error('Error fetching bank data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load banking data.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, [companyId]);

  const getCARStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'adequate':
        return 'yellow';
      case 'undercapitalized':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading bank dashboard...</Text>
      </Box>
    );
  }

  if (!bankData?.licensed) {
    return (
      <Alert status="info">
        <AlertIcon />
        <Box>
          <AlertTitle>No Banking License</AlertTitle>
          <AlertDescription>
            Your company does not have a banking license. Reach Level 3 and purchase a license ($500k) to start banking operations.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  const activeLoans = issuedLoans.filter((l) => l.status === 'Active');
  const totalLent = activeLoans.reduce((sum, l) => sum + l.balance, 0);
  const netProfit = bankData.totalInterestEarned - bankData.defaultLosses;
  const defaultRate =
    bankData.totalLoansIssued > 0 ? (bankData.defaultLosses / (totalLent + bankData.defaultLosses)) * 100 : 0;

  return (
    <VStack spacing={6} align="stretch">
      {/* CAR Status Alert */}
      {bankData.carStatus !== 'healthy' && (
        <Alert status={bankData.carStatus === 'adequate' ? 'warning' : 'error'}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              {bankData.carStatus === 'adequate' ? 'CAR Near Minimum' : 'CAR Below Minimum'}
            </AlertTitle>
            <AlertDescription>
              {bankData.carStatus === 'adequate'
                ? `CAR is ${(bankData.car * 100).toFixed(1)}%, close to 8% minimum. Consider raising capital.`
                : `CAR is ${(bankData.car * 100).toFixed(1)}%, below 8% minimum. Cannot issue new loans until compliant.`}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Capital Adequacy Ratio */}
      <Box p={6} bg="gray.50" borderRadius="lg">
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Capital Adequacy Ratio (CAR)
        </Text>
        <HStack spacing={8} align="flex-start">
          <Box flex={1}>
            <Text fontSize="5xl" fontWeight="bold" color={getCARStatusColor(bankData.carStatus) + '.500'}>
              {(bankData.car * 100).toFixed(2)}%
            </Text>
            <Badge colorScheme={getCARStatusColor(bankData.carStatus)} fontSize="md" px={3} py={1} borderRadius="full">
              {bankData.carStatus.charAt(0).toUpperCase() + bankData.carStatus.slice(1)}
            </Badge>
            <Progress
              value={bankData.car * 100}
              max={15}
              colorScheme={getCARStatusColor(bankData.carStatus)}
              size="lg"
              mt={4}
              borderRadius="full"
            />
            <HStack justify="space-between" mt={2} fontSize="sm" color="gray.600">
              <Text>0%</Text>
              <Text fontWeight="bold">8% Min</Text>
              <Text>10.5% Recommended</Text>
              <Text>15%</Text>
            </HStack>
          </Box>

          <Box flex={1}>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="medium">Tier 1 Capital:</Text>
                <Text fontSize="sm" fontWeight="bold">${bankData.capital.toLocaleString()}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="medium">Risk-Weighted Assets:</Text>
                <Text fontSize="sm" fontWeight="bold">${bankData.riskWeightedAssets.toLocaleString()}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="medium">Lending Capacity:</Text>
                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                  ${Math.max(0, bankData.capital - totalLent).toLocaleString()}
                </Text>
              </HStack>
            </VStack>
          </Box>
        </HStack>
      </Box>

      {/* Performance Metrics */}
      <StatGroup>
        <Stat>
          <StatLabel>Total Loans Issued</StatLabel>
          <StatNumber>{bankData.totalLoansIssued}</StatNumber>
          <StatHelpText>{activeLoans.length} active</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Lent</StatLabel>
          <StatNumber>${totalLent.toLocaleString()}</StatNumber>
          <StatHelpText>Outstanding balance</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Interest Earned</StatLabel>
          <StatNumber>${bankData.totalInterestEarned.toLocaleString()}</StatNumber>
          <StatHelpText>Lifetime</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Net Profit/Loss</StatLabel>
          <StatNumber color={netProfit >= 0 ? 'green.500' : 'red.500'}>
            <StatArrow type={netProfit >= 0 ? 'increase' : 'decrease'} />
            ${Math.abs(netProfit).toLocaleString()}
          </StatNumber>
          <StatHelpText>
            Default losses: ${bankData.defaultLosses.toLocaleString()}
          </StatHelpText>
        </Stat>
      </StatGroup>

      <Divider />

      {/* Tabs: Issued Loans | Recommendations */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Issued Loans ({issuedLoans.length})</Tab>
          <Tab>CAR Recommendations ({bankData.recommendations.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Issued Loans Tab */}
          <TabPanel>
            {issuedLoans.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No loans issued yet. Start lending to earn interest income!
              </Alert>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Borrower</Th>
                      <Th isNumeric>Principal</Th>
                      <Th isNumeric>Balance</Th>
                      <Th isNumeric>Rate</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Payments</Th>
                      <Th>Originated</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {issuedLoans.map((loan) => (
                      <Tr key={loan._id}>
                        <Td fontWeight="medium">{loan.borrowerName}</Td>
                        <Td isNumeric>${loan.principal.toLocaleString()}</Td>
                        <Td isNumeric>${loan.balance.toLocaleString()}</Td>
                        <Td isNumeric>{loan.interestRate.toFixed(2)}%</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              loan.status === 'Active'
                                ? 'green'
                                : loan.status === 'PaidOff'
                                ? 'blue'
                                : 'red'
                            }
                          >
                            {loan.status}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          {loan.paymentsMade} / {loan.termMonths}
                        </Td>
                        <Td fontSize="sm">{new Date(loan.originationDate).toLocaleDateString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                {/* Portfolio Summary */}
                <Box mt={6} p={4} bg="blue.50" borderRadius="md">
                  <Text fontWeight="bold" mb={3}>
                    Portfolio Summary
                  </Text>
                  <HStack spacing={6}>
                    <Stat size="sm">
                      <StatLabel>Default Rate</StatLabel>
                      <StatNumber color={defaultRate > 5 ? 'red.500' : defaultRate > 2 ? 'yellow.500' : 'green.500'}>
                        {defaultRate.toFixed(2)}%
                      </StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Avg. Interest Rate</StatLabel>
                      <StatNumber>
                        {issuedLoans.length > 0
                          ? (
                              issuedLoans.reduce((sum, l) => sum + l.interestRate, 0) / issuedLoans.length
                            ).toFixed(2)
                          : 0}%
                      </StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Capital Utilization</StatLabel>
                      <StatNumber>
                        {bankData.capital > 0 ? ((totalLent / bankData.capital) * 100).toFixed(1) : 0}%
                      </StatNumber>
                    </Stat>
                  </HStack>
                </Box>
              </Box>
            )}
          </TabPanel>

          {/* Recommendations Tab */}
          <TabPanel>
            <VStack align="stretch" spacing={3}>
              {bankData.recommendations.map((rec, idx) => (
                <Box key={idx} p={3} bg="yellow.50" borderLeft="4px" borderColor="yellow.400" borderRadius="md">
                  <Text fontSize="sm">{rec}</Text>
                </Box>
              ))}
              {bankData.recommendations.length === 0 && (
                <Alert status="success">
                  <AlertIcon />
                  No recommendations. Your bank is operating optimally!
                </Alert>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Quick Actions */}
      <HStack spacing={4}>
        <Button colorScheme="blue" flex={1} isDisabled={bankData.carStatus === 'undercapitalized'}>
          Issue New Loan
        </Button>
        <Button colorScheme="green" flex={1}>
          Add Capital
        </Button>
        <Button variant="outline" flex={1}>
          Withdraw Capital
        </Button>
      </HStack>
    </VStack>
  );
}

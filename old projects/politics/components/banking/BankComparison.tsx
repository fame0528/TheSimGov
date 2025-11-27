/**
 * @file components/banking/BankComparison.tsx
 * @description Compare player-owned banks for peer-to-peer lending
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Displays list of player-owned banks (Level 3+ companies with banking licenses)
 * for borrowing comparison. Shows interest rates, lending capacity, CAR status,
 * and performance metrics. Enables peer-to-peer lending requests.
 * 
 * FEATURES:
 * - Player bank directory
 * - Interest rate comparison
 * - CAR (Capital Adequacy Ratio) display
 * - Lending capacity indicators
 * - Bank performance metrics
 * - Loan request initiation
 * 
 * USAGE:
 * ```tsx
 * import BankComparison from '@/components/banking/BankComparison';
 * 
 * <BankComparison companyId={companyId} onSelectBank={handleBankSelect} />
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
  Spinner,
  Alert,
  AlertIcon,
  Input,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
} from '@chakra-ui/react';

interface BankComparisonProps {
  companyId: string;
  onSelectBank?: (bankId: string) => void;
}

interface PlayerBank {
  _id: string;
  name: string;
  level: number;
  playerBank: {
    capital: number;
    totalLoansIssued: number;
    totalInterestEarned: number;
    defaultLosses: number;
  };
  car: number;
  carStatus: string;
  averageRate: number;
  availableCapital: number;
}

interface LoanRequest {
  amount: string;
  termMonths: string;
  collateralType: string;
  collateralValue: string;
}

export default function BankComparison({ companyId, onSelectBank }: BankComparisonProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<PlayerBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<PlayerBank | null>(null);
  const [showLoanRequestModal, setShowLoanRequestModal] = useState(false);
  const [loanRequest, setLoanRequest] = useState<LoanRequest>({
    amount: '',
    termMonths: '60',
    collateralType: 'None',
    collateralValue: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    const fetchPlayerBanks = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/banking/player/banks');
        if (res.ok) {
          const data = await res.json();
          setBanks(data.banks || []);
        }
      } catch (error) {
        console.error('Error fetching player banks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerBanks();
  }, []);

  const handleRequestLoan = (bank: PlayerBank) => {
    setSelectedBank(bank);
    setShowLoanRequestModal(true);
  };

  const handleSubmitLoanRequest = async () => {
    if (!selectedBank) return;

    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/banking/player/lend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: selectedBank._id,
          borrowerId: companyId,
          amount: parseFloat(loanRequest.amount),
          interestRate: selectedBank.averageRate, // Use bank's average rate
          termMonths: parseInt(loanRequest.termMonths),
          collateralType: loanRequest.collateralType,
          collateralValue: parseFloat(loanRequest.collateralValue) || 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Loan request submitted!',
          description: data.message || 'Loan approved and funded.',
          status: 'success',
          duration: 5000,
        });
        setShowLoanRequestModal(false);
        setLoanRequest({ amount: '', termMonths: '60', collateralType: 'None', collateralValue: '' });
        if (onSelectBank) onSelectBank(selectedBank._id);
      } else {
        toast({
          title: 'Loan request failed',
          description: data.message || 'Unable to process loan request.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit loan request.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

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
        <Text mt={4}>Loading player banks...</Text>
      </Box>
    );
  }

  if (banks.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No player-owned banks available. Become Level 3 to start your own bank!
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Player-Owned Banks
        </Text>
        <Text fontSize="sm" color="gray.600">
          Compare rates and terms from Level 3+ player banks
        </Text>
      </Box>

      {/* Banks Table */}
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Bank Name</Th>
              <Th>Level</Th>
              <Th isNumeric>Available Capital</Th>
              <Th isNumeric>Avg. Rate</Th>
              <Th>CAR Status</Th>
              <Th isNumeric>Loans Issued</Th>
              <Th isNumeric>Default Rate</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {banks.map((bank) => {
              const defaultRate =
                bank.playerBank.totalLoansIssued > 0
                  ? (bank.playerBank.defaultLosses /
                      (bank.playerBank.totalInterestEarned + bank.playerBank.defaultLosses)) *
                    100
                  : 0;

              return (
                <Tr key={bank._id}>
                  <Td fontWeight="medium">{bank.name}</Td>
                  <Td>
                    <Badge colorScheme="purple">L{bank.level}</Badge>
                  </Td>
                  <Td isNumeric>${bank.availableCapital.toLocaleString()}</Td>
                  <Td isNumeric>{bank.averageRate.toFixed(2)}%</Td>
                  <Td>
                    <Badge colorScheme={getCARStatusColor(bank.carStatus)}>
                      {(bank.car * 100).toFixed(1)}% {bank.carStatus}
                    </Badge>
                  </Td>
                  <Td isNumeric>{bank.playerBank.totalLoansIssued}</Td>
                  <Td isNumeric>
                    <Text color={defaultRate > 5 ? 'red.500' : defaultRate > 2 ? 'yellow.500' : 'green.500'}>
                      {defaultRate.toFixed(1)}%
                    </Text>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleRequestLoan(bank)}
                      isDisabled={bank.carStatus === 'undercapitalized' || bank.availableCapital < 10000}
                    >
                      Request Loan
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {/* Loan Request Modal */}
      <Modal isOpen={showLoanRequestModal} onClose={() => setShowLoanRequestModal(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Loan from {selectedBank?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedBank && (
              <VStack spacing={4} align="stretch">
                {/* Bank Stats */}
                <Box p={4} bg="gray.50" borderRadius="md">
                  <HStack spacing={4}>
                    <Stat size="sm">
                      <StatLabel>Available Capital</StatLabel>
                      <StatNumber>${selectedBank.availableCapital.toLocaleString()}</StatNumber>
                      <StatHelpText>CAR: {(selectedBank.car * 100).toFixed(1)}%</StatHelpText>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Interest Rate</StatLabel>
                      <StatNumber>{selectedBank.averageRate.toFixed(2)}%</StatNumber>
                      <StatHelpText>Annual</StatHelpText>
                    </Stat>
                  </HStack>
                </Box>

                {/* Loan Request Form */}
                <FormControl isRequired>
                  <FormLabel>Loan Amount ($)</FormLabel>
                  <Input
                    type="number"
                    min={1000}
                    max={selectedBank.availableCapital}
                    step={1000}
                    value={loanRequest.amount}
                    onChange={(e) => setLoanRequest({ ...loanRequest, amount: e.target.value })}
                    placeholder="100000"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Max: ${selectedBank.availableCapital.toLocaleString()}
                  </Text>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Term (months)</FormLabel>
                  <Select
                    value={loanRequest.termMonths}
                    onChange={(e) => setLoanRequest({ ...loanRequest, termMonths: e.target.value })}
                  >
                    <option value="12">12 months (1 year)</option>
                    <option value="24">24 months (2 years)</option>
                    <option value="36">36 months (3 years)</option>
                    <option value="60">60 months (5 years)</option>
                    <option value="120">120 months (10 years)</option>
                    <option value="180">180 months (15 years)</option>
                    <option value="240">240 months (20 years)</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Collateral Type</FormLabel>
                  <Select
                    value={loanRequest.collateralType}
                    onChange={(e) => setLoanRequest({ ...loanRequest, collateralType: e.target.value })}
                  >
                    <option value="None">None (Unsecured)</option>
                    <option value="Equipment">Equipment/Machinery</option>
                    <option value="RealEstate">Real Estate/Property</option>
                    <option value="Inventory">Inventory/Stock</option>
                    <option value="AR">Accounts Receivable</option>
                  </Select>
                </FormControl>

                {loanRequest.collateralType !== 'None' && (
                  <FormControl isRequired>
                    <FormLabel>Collateral Value ($)</FormLabel>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={loanRequest.collateralValue}
                      onChange={(e) => setLoanRequest({ ...loanRequest, collateralValue: e.target.value })}
                      placeholder="150000"
                    />
                  </FormControl>
                )}

                {/* Estimated Monthly Payment */}
                {loanRequest.amount && loanRequest.termMonths && (
                  <Box p={3} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium">
                      Estimated Monthly Payment
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      $
                      {(
                        (parseFloat(loanRequest.amount) *
                          (selectedBank.averageRate / 100 / 12) *
                          Math.pow(1 + selectedBank.averageRate / 100 / 12, parseInt(loanRequest.termMonths))) /
                        (Math.pow(1 + selectedBank.averageRate / 100 / 12, parseInt(loanRequest.termMonths)) - 1)
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {loanRequest.termMonths} payments at {selectedBank.averageRate.toFixed(2)}% APR
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button onClick={() => setShowLoanRequestModal(false)}>Cancel</Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmitLoanRequest}
                isLoading={submittingRequest}
                isDisabled={!loanRequest.amount || !loanRequest.termMonths}
              >
                Submit Request
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

/**
 * @file app/(game)/banking/page.tsx
 * @description Main banking page with tabs for loans, credit, and player banking
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Unified banking interface combining loan applications, loan management,
 * credit score display, player bank comparison, and player bank dashboard.
 * Dynamic layout based on company level (L3+ shows player banking features).
 * 
 * FEATURES:
 * - Tabbed interface for different banking functions
 * - Loan application form (all levels)
 * - Loan dashboard (active loans management)
 * - Credit score display and tracking
 * - Player bank comparison (borrow from peers)
 * - Player bank dashboard (L3+ only, manage own bank)
 * - Banking license purchase (L3+ without license)
 * 
 * USAGE:
 * Navigate to /banking in-game to access banking features
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  Button,
  useToast,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import LoanApplicationForm from '@/components/banking/LoanApplicationForm';
import LoanDashboard from '@/components/banking/LoanDashboard';
import CreditScoreDisplay from '@/components/banking/CreditScoreDisplay';
import BankComparison from '@/components/banking/BankComparison';
import BankDashboard from '@/components/banking/BankDashboard';

export default function BankingPage() {
  const { data: session, status } = useSession();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [purchasingLicense, setPurchasingLicense] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (status !== 'authenticated' || !session?.user?.id) return;

      setLoading(true);
      try {
        // Fetch user's primary company
        const res = await fetch('/api/companies/my-companies');
        if (res.ok) {
          const data = await res.json();
          if (data.companies?.length > 0) {
            setCompany(data.companies[0]); // Use first company
          }
        }
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [session, status]);

  const handlePurchaseLicense = async () => {
    if (!company) return;

    setPurchasingLicense(true);
    try {
      const res = await fetch('/api/banking/player/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company._id,
          initialCapital: 5000000, // $5M minimum
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Banking license purchased!',
          description: data.message || 'Your bank is now operational.',
          status: 'success',
          duration: 5000,
        });
        // Refresh company data
        const companyRes = await fetch('/api/companies/my-companies');
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          if (companyData.companies?.length > 0) {
            setCompany(companyData.companies[0]);
          }
        }
      } else {
        toast({
          title: 'License purchase failed',
          description: data.message || 'Unable to purchase banking license.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to purchase banking license.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setPurchasingLicense(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={4}>Loading banking...</Text>
        </Box>
      </Container>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Please sign in to access banking features.
        </Alert>
      </Container>
    );
  }

  if (!company) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info">
          <AlertIcon />
          No company found. Create a company to access banking features.
        </Alert>
      </Container>
    );
  }

  const isLevel3Plus = company.level >= 3;
  const hasPlayerBank = company.playerBank?.licensed;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="xl">Banking & Loans</Heading>
              <Text color="gray.600" mt={2}>
                {company.name} - Level {company.level}
              </Text>
            </Box>
            {isLevel3Plus && !hasPlayerBank && (
              <Button
                colorScheme="purple"
                size="lg"
                onClick={handlePurchaseLicense}
                isLoading={purchasingLicense}
              >
                Purchase Banking License ($500k)
              </Button>
            )}
            {hasPlayerBank && (
              <Badge colorScheme="purple" fontSize="lg" px={4} py={2}>
                Licensed Bank
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Player Banking Info (L3+ only) */}
        {isLevel3Plus && !hasPlayerBank && (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Unlock Player Banking!</Text>
              <Text fontSize="sm">
                As a Level 3+ company, you can purchase a banking license ($500k) and start lending to other players.
                Earn interest income and build your banking empire!
              </Text>
            </Box>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Apply for Loan</Tab>
            <Tab>My Loans</Tab>
            <Tab>Credit Score</Tab>
            {isLevel3Plus && <Tab>Player Banks</Tab>}
            {hasPlayerBank && <Tab>My Bank</Tab>}
          </TabList>

          <TabPanels>
            {/* Apply for Loan Tab */}
            <TabPanel>
              <LoanApplicationForm
                companyId={company._id}
                onSuccess={() => {
                  toast({
                    title: 'Success!',
                    description: 'Loan application submitted.',
                    status: 'success',
                    duration: 3000,
                  });
                }}
              />
            </TabPanel>

            {/* My Loans Tab */}
            <TabPanel>
              <LoanDashboard companyId={company._id} />
            </TabPanel>

            {/* Credit Score Tab */}
            <TabPanel>
              <CreditScoreDisplay companyId={company._id} />
            </TabPanel>

            {/* Player Banks Tab (L3+ only) */}
            {isLevel3Plus && (
              <TabPanel>
                <BankComparison companyId={company._id} />
              </TabPanel>
            )}

            {/* My Bank Tab (Licensed banks only) */}
            {hasPlayerBank && (
              <TabPanel>
                <BankDashboard companyId={company._id} />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

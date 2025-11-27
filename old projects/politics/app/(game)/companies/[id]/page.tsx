/**
 * @file app/(game)/companies/[id]/page.tsx
 * @description Individual company dashboard page
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Company dashboard showing detailed financials, employee list (placeholder),
 * and recent transactions. Provides overview of single company operations.
 * 
 * ROUTE: /companies/[id]
 * PROTECTION: Requires authentication and company ownership
 * 
 * FEATURES:
 * - Company financial summary
 * - Revenue/expense breakdown
 * - Employee count (detailed view coming in Sprint 4)
 * - Recent transactions placeholder
 * - Mission statement display
 * 
 * IMPLEMENTATION NOTES:
 * - Fetches company data by ID
 * - Validates ownership (user must own company)
 * - Returns 404 if company not found
 * - Returns 403 if user doesn't own company
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Badge,
  Button,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import OperatingCostsBreakdown from '@/components/companies/OperatingCostsBreakdown';
import USMap from '@/components/map/USMap';
import type { ICompany } from '@/lib/db/models/Company';
import type { ICompanyLocation } from '@/lib/db/models/CompanyLocation';
import { INDUSTRY_INFO } from '@/lib/constants/industries';
import { usePerformanceMonitor, useApiMonitor } from '@/lib/hooks/usePerformance';

/**
 * Format currency with commas and dollar sign
 */
const formatCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formatted = absoluteAmount.toLocaleString('en-US');
  return isNegative ? `-$${formatted}` : `$${formatted}`;
};

/**
 * Company dashboard page
 */
export default function CompanyDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const unwrappedParams = use(params);
  const toast = useToast();
  const [company, setCompany] = useState<(ICompany & { _id: string; netWorth?: number; profitLoss?: number }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelInfo, setLevelInfo] = useState<any | null>(null);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [locations, setLocations] = useState<ICompanyLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Performance monitoring - track render time and component count
  usePerformanceMonitor('CompanyDashboard', {
    companyId: unwrappedParams.id,
    locationsCount: locations.length,
  });

  // Monitor API calls with performance tracking
  const monitoredFetch = useApiMonitor('/api/companies');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const response = await monitoredFetch({ method: 'GET' });
        
        if (!response.ok) {
          throw new Error('Failed to fetch company');
        }
        
        const data = await response.json();
        const foundCompany = data.companies.find((c: ICompany & { _id: string }) => c._id === unwrappedParams.id);
        
        if (!foundCompany) {
          setError('Company not found');
        } else {
          setCompany(foundCompany);
          // In parallel, fetch level-info, politics eligibility, and locations
          // These calls are safe to run client-side for this dashboard context
          Promise.all([
            fetch(`/api/companies/${unwrappedParams.id}/level-info`).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed level-info'))),
            fetch(`/api/politics/eligibility?companyId=${unwrappedParams.id}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed eligibility'))),
          ]).then(([levelInfoData, eligibilityData]) => {
            setLevelInfo(levelInfoData);
            setEligibility(eligibilityData);
          }).catch((e) => {
            console.warn('Optional politics data fetch failed:', e);
          });

          // Fetch locations separately
          fetchLocations();
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchCompany();
    }
  }, [unwrappedParams.id, status]);

  /**
   * Fetch company locations from API
   */
  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch(`/api/locations?companyId=${unwrappedParams.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      toast({
        title: 'Locations Error',
        description: 'Failed to load company locations',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingLocations(false);
    }
  };

  /**
   * Handle successful location creation
   */
  const handleLocationCreated = (newLocation: ICompanyLocation) => {
    setLocations((prev) => [...prev, newLocation]);
    
    // Refresh company data to reflect updated cash balance
    fetch(`/api/companies?limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const updated = data.companies.find((c: ICompany & { _id: string }) => c._id === unwrappedParams.id);
        if (updated) {
          setCompany(updated);
        }
      })
      .catch((err) => console.error('Error refreshing company:', err));
  };

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <Box minH="100vh" bg="night.500" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    );
  }

  // Don't render if not authenticated
  if (!session?.user) {
    return null;
  }

  // Error state
  if (error || !company) {
    return (
      <Box minH="100vh" bg="night.500">
        <TopMenu user={session.user} />
        <Box px={6} py={6} pb={20}>
          <VStack spacing={6}>
            <Box
              bg="night.400"
              p={8}
              borderRadius="2xl"
              borderWidth={1}
              borderColor="red_cmyk.500"
              textAlign="center"
            >
              <Text color="red_cmyk.500" fontSize="xl" mb={4}>
                {error || 'Company not found'}
              </Text>
              <Button
                onClick={() => router.push('/companies')}
                bg="picton_blue.500"
                color="white"
                _hover={{ bg: 'picton_blue.600' }}
              >
                Back to Companies
              </Button>
            </Box>
          </VStack>
        </Box>
        <StatusBar />
      </Box>
    );
  }

  const profitLoss = company.profitLoss ?? (company.revenue - company.expenses);
  const netWorth = company.netWorth ?? company.cash;

  return (
    <Box minH="100vh" bg="night.500">
      <TopMenu user={session.user} />

      <Box px={6} py={6} pb={20}>
        <VStack spacing={6} align="stretch">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/companies')}
            variant="ghost"
            color="picton_blue.500"
            leftIcon={<ArrowBackIcon />}
            width="fit-content"
            _hover={{ bg: 'night.400' }}
          >
            Back to Companies
          </Button>

          {/* Company Header */}
          <Box
            bg="night.400"
            p={8}
            borderRadius="2xl"
            borderWidth={1}
            borderColor="ash_gray.800"
          >
            <HStack justify="space-between" align="start" mb={4}>
              <VStack align="start" spacing={2}>
                <Heading as="h1" size="2xl" color="white">
                  {company.name}
                </Heading>
                <HStack spacing={3}>
                  <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                    {company.industry}
                  </Badge>
                  <Text color="ash_gray.400">
                    Founded {new Date(company.foundedAt).toLocaleDateString()}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            {/* Mission Statement */}
            {company.mission && (
              <Box mt={4} p={4} bg="night.300" borderRadius="md">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Mission
                </Text>
                <Text color="white" fontSize="md" fontStyle="italic">
                  "{company.mission}"
                </Text>
              </Box>
            )}

            {/* Industry Info */}
            <Box mt={4} p={4} bg="night.300" borderRadius="md" borderColor="picton_blue.500" borderWidth={1}>
              <Text color="picton_blue.500" fontSize="sm">
                <strong>{company.industry}:</strong>{' '}
                {INDUSTRY_INFO[company.industry]?.description}
              </Text>
            </Box>
          </Box>

          {/* Financial Stats */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            {/* Cash */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="gold.500">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Cash on Hand
                </Text>
                <Text color="gold.500" fontSize="3xl" fontWeight="bold">
                  {formatCurrency(company.cash)}
                </Text>
              </Box>
            </GridItem>

            {/* Net Worth */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Net Worth
                </Text>
                <Text color="gold.500" fontSize="3xl" fontWeight="bold">
                  {formatCurrency(netWorth)}
                </Text>
              </Box>
            </GridItem>

            {/* Revenue */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Total Revenue
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold">
                  {formatCurrency(company.revenue)}
                </Text>
              </Box>
            </GridItem>

            {/* Expenses */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Total Expenses
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold">
                  {formatCurrency(company.expenses)}
                </Text>
              </Box>
            </GridItem>
          </Grid>

          {/* Profit/Loss and Employees */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {/* Profit/Loss */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Lifetime Profit/Loss
                </Text>
                <Text
                  color={profitLoss >= 0 ? 'green.400' : 'red_cmyk.500'}
                  fontSize="3xl"
                  fontWeight="bold"
                >
                  {profitLoss >= 0 ? '+' : ''}
                  {formatCurrency(profitLoss)}
                </Text>
                <Text color="ash_gray.600" fontSize="sm" mt={2}>
                  {profitLoss >= 0 ? 'Profitable' : 'Operating at a loss'}
                </Text>
              </Box>
            </GridItem>

            {/* Employees */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                  Employees
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold">
                  {company.employees}
                </Text>
                <Text color="ash_gray.600" fontSize="sm" mt={2}>
                  Employee management coming in Sprint 4
                </Text>
              </Box>
            </GridItem>
          </Grid>

          {/* Politics */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Heading as="h3" size="md" color="white" mb={4}>
                  Political Influence
                </Heading>
                {levelInfo?.politicalInfluence ? (
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text color="ash_gray.500">Donation Cap</Text>
                      <Text color="gold.500" fontWeight="bold">
                        {formatCurrency(levelInfo.politicalInfluence.maxDonationAmount || 0)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="ash_gray.500">Can Lobby</Text>
                      <Text color="white">{levelInfo.politicalInfluence.canLobby ? 'Yes' : 'No'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="ash_gray.500">Lobbying Points</Text>
                      <Text color="white">{levelInfo.politicalInfluence.lobbyingPowerPoints ?? 0}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="ash_gray.500">Can Run for Office</Text>
                      <Text color="white">{levelInfo.politicalInfluence.canRunForOffice ? 'Yes' : 'No'}</Text>
                    </HStack>
                    {levelInfo.nextLevelPoliticalInfluence ? (
                      <Box mt={3} p={3} bg="night.300" borderRadius="md">
                        <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={1}>
                          Next Level Preview
                        </Text>
                        <HStack justify="space-between">
                          <Text color="ash_gray.500">Donation Cap</Text>
                          <Text color="ash_gray.200">{formatCurrency(levelInfo.nextLevelPoliticalInfluence.maxDonationAmount || 0)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="ash_gray.500">Can Lobby</Text>
                          <Text color="ash_gray.200">{levelInfo.nextLevelPoliticalInfluence.canLobby ? 'Yes' : 'No'}</Text>
                        </HStack>
                      </Box>
                    ) : null}
                  </VStack>
                ) : (
                  <Text color="ash_gray.600" fontSize="sm">Politics data will appear once available.</Text>
                )}
              </Box>
            </GridItem>

            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Heading as="h3" size="md" color="white" mb={4}>
                  Allowed Actions
                </Heading>
                {eligibility?.allowedActions?.length ? (
                  <VStack align="stretch" spacing={2}>
                    {eligibility.allowedActions.map((a: string) => (
                      <Box key={a} p={2} bg="night.300" borderRadius="md">
                        <Text color="white">{a}</Text>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text color="ash_gray.600" fontSize="sm">No political actions available yet.</Text>
                )}
              </Box>
            </GridItem>
          </Grid>

          {/* Operating Costs */}
          <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
            <OperatingCostsBreakdown company={company} />
          </Box>

          {/* Locations */}
          <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
            <Heading as="h3" size="md" color="white" mb={4}>
              Company Locations
            </Heading>
            
            {isLoadingLocations ? (
              <Text color="ash_gray.600" fontSize="sm">Loading locations...</Text>
            ) : (
              <>
                {locations.length > 0 && (
                  <Box mb={4}>
                    <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                      Current Locations ({locations.length})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {locations.map((loc) => (
                        <Box
                          key={String(loc._id)}
                          p={3}
                          bg="night.300"
                          borderRadius="md"
                          borderWidth={1}
                          borderColor={loc.type === 'HQ' ? 'gold.500' : 'ash_gray.700'}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <HStack>
                                <Badge colorScheme={loc.type === 'HQ' ? 'yellow' : 'blue'} fontSize="xs">
                                  {loc.type}
                                </Badge>
                                <Text color="white" fontSize="sm" fontWeight="medium">
                                  {loc.state} - {loc.region}
                                </Text>
                              </HStack>
                              <Text color="ash_gray.500" fontSize="xs">
                                {loc.address}
                              </Text>
                            </VStack>
                            <Text color="ash_gray.600" fontSize="xs">
                              Opened {new Date(loc.openedAt).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                <Box>
                  <Text color="ash_gray.500" fontSize="xs" textTransform="uppercase" mb={2}>
                    Expansion Map
                  </Text>
                  <Text color="ash_gray.600" fontSize="sm" mb={3}>
                    Click any state to preview expansion costs and create a new location
                  </Text>
                  <USMap
                    mode="locations"
                    companyId={unwrappedParams.id}
                    locations={locations}
                    onLocationCreate={handleLocationCreated}
                  />
                </Box>
              </>
            )}
          </Box>

          {/* Industry-Specific Dashboards */}
          {company.industry === 'Technology' && (
            <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="picton_blue.500">
              <Heading as="h3" size="md" color="white" mb={4}>
                Technology & Innovation Dashboard
              </Heading>
              <Text color="ash_gray.400" fontSize="sm" mb={4}>
                Access AI research management, breakthrough tracking, patent portfolio, licensing revenue, 
                regulatory compliance, and innovation metrics for your technology company.
              </Text>
              <Button
                onClick={() => router.push(`/companies/${unwrappedParams.id}/technology`)}
                bg="picton_blue.500"
                color="white"
                _hover={{ bg: 'picton_blue.600' }}
                size="lg"
              >
                Open Technology Dashboard →
              </Button>
            </Box>
          )}

          {/* Placeholders for Future Features */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {/* Recent Transactions */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Heading as="h3" size="md" color="white" mb={4}>
                  Recent Transactions
                </Heading>
                <Text color="ash_gray.600" fontSize="sm">
                  Transaction history coming soon. All financial operations will be logged here.
                </Text>
              </Box>
            </GridItem>

            {/* Quick Actions */}
            <GridItem>
              <Box bg="night.400" p={6} borderRadius="2xl" borderWidth={1} borderColor="ash_gray.800">
                <Heading as="h3" size="md" color="white" mb={4}>
                  Quick Actions
                </Heading>
                <VStack spacing={3} align="stretch">
                  <Button
                    isDisabled
                    bg="ash_gray.800"
                    color="ash_gray.600"
                    _hover={{}}
                    _active={{}}
                  >
                    Hire Employees (Sprint 4)
                  </Button>
                  <Button
                    isDisabled
                    bg="ash_gray.800"
                    color="ash_gray.600"
                    _hover={{}}
                    _active={{}}
                  >
                    View Contracts (Sprint 5)
                  </Button>
                  <Button
                    isDisabled
                    bg="ash_gray.800"
                    color="ash_gray.600"
                    _hover={{}}
                    _active={{}}
                  >
                    Financial Reports (Sprint 6)
                  </Button>
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      </Box>

      <StatusBar />
    </Box>
  );
}

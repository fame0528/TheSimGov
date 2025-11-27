/**
 * @file app/(game)/companies/page.tsx
 * @description Companies management page with creation and list view
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Companies page for creating and managing business entities.
 * Displays user's companies with financial stats and provides creation form.
 * Shows "no companies" state with call-to-action when user has zero companies.
 * 
 * ROUTE: /companies
 * PROTECTION: Requires authentication
 * 
 * FEATURES:
 * - Company creation form with industry selection
 * - Company list with financial metrics
 * - Click-to-view company details
 * - Empty state with CTA for first company
 * - Real-time company data fetching
 * 
 * USAGE:
 * Navigate to /companies after authentication
 * 
 * IMPLEMENTATION NOTES:
 * - Server component for initial data fetch
 * - Revalidates on navigation for fresh data
 * - Passes user session to child components
 * - Uses TopMenu and StatusBar for layout consistency
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Text, VStack, Button, Grid, GridItem, Icon } from '@chakra-ui/react';
import SectionCard from '@/components/ui/SectionCard';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import CompanyCard from '@/components/companies/CompanyCard';
import type { ICompany } from '@/lib/db/models/Company';

export default function CompaniesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Companies state
  const [companies, setCompanies] = useState<(ICompany & { _id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  /**
   * Fetch user's companies
   */
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/companies');
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  /**
   * Handle company card click
   */
  const handleCompanyClick = (companyId: string) => {
    router.push(`/companies/${companyId}`);
  };

  // Show loading while checking authentication
  if (status === 'loading') {
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

  return (
    <Box minH="100vh" bg="night.500">
      <TopMenu user={session.user} />

      <Box px={6} py={6} pb={20}>
        <VStack spacing={6} align="stretch">
          {/* Page Header */}
          <SectionCard
            title="Your Companies"
            iconClass="fa-solid fa-briefcase"
            rightSlot={
              <Button onClick={() => router.push('/companies/new')} variant="primary">
                Create Company
              </Button>
            }
          >
            <Text color="subtext" fontSize="lg">Manage your business empire</Text>
          </SectionCard>

          {/* Loading State */}
          {isLoading && (
            <SectionCard title="Loading" iconClass="fa-solid fa-spinner" >
              <Box textAlign="center">
              <Text color="ash_gray.400">Loading companies...</Text>
              </Box>
            </SectionCard>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <SectionCard title="Error" iconClass="fa-solid fa-circle-exclamation">
              <Box textAlign="center">
                <Text color="red_cmyk.500" mb={4}>{error}</Text>
                <Button onClick={fetchCompanies} variant="primary">Retry</Button>
              </Box>
            </SectionCard>
          )}

          {/* Empty State */}
          {!isLoading && !error && companies.length === 0 && (
            <SectionCard title="No Companies Yet" iconClass="fa-solid fa-building">
              <Box p={2} textAlign="center">
              <Icon viewBox="0 0 20 20" boxSize={16} color="ash_gray.700" mb={4}>
                <path
                  fill="currentColor"
                  d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"
                />
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </Icon>
              <Text color="ash_gray.400" fontSize="md" mb={6} maxW="500px" mx="auto">
                Start your entrepreneurial journey by founding your first company.
                Choose from 6 industries and receive $10,000 in seed capital.
              </Text>
              <Button onClick={() => router.push('/companies/new')} size="lg" variant="primary">
                Found Your First Company
              </Button>
              </Box>
            </SectionCard>
          )}

          {/* Companies Grid */}
          {!isLoading && !error && companies.length > 0 && (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
              {companies.map((company) => (
                <GridItem key={company._id.toString()}>
                  <CompanyCard
                    company={company}
                    onClick={() => handleCompanyClick(company._id.toString())}
                  />
                </GridItem>
              ))}
            </Grid>
          )}
        </VStack>
      </Box>

      <StatusBar />
    </Box>
  );
}


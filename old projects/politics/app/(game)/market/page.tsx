/**
 * @file app/(game)/market/page.tsx
 * @description Market and economy page
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Market page for viewing economic data and trends.
 * Placeholder for future market features.
 * 
 * ROUTE: /market
 * PROTECTION: Requires authentication
 */

import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { Box, Text, VStack } from '@chakra-ui/react';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import SectionCard from '@/components/ui/SectionCard';

export default async function MarketPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <Box minH="100vh" bg="night.500">
      <TopMenu user={user} />

      <Box px={6} py={6} pb={20}>
        <VStack spacing={6} align="stretch">
          <SectionCard title="Market" iconClass="fa-solid fa-chart-line">
            <Text color="subtext" fontSize="lg">View economic trends and opportunities</Text>
          </SectionCard>

          <SectionCard title="Coming Soon" iconClass="fa-solid fa-chart-area">
            <Text color="subtext" fontSize="md">
              Market and economy features coming soon in Sprint 5.
            </Text>
            <Text color="ash_gray.700" fontSize="sm" mt={4}>
              Features will include:
            </Text>
            <VStack spacing={1} align="stretch" mt={2} fontSize="sm" color="ash_gray.700">
              <Text>• Real-time market data</Text>
              <Text>• Economic indicators by state</Text>
              <Text>• Contract opportunities</Text>
              <Text>• Supply and demand dynamics</Text>
              <Text>• Industry analysis</Text>
            </VStack>
          </SectionCard>
        </VStack>
      </Box>

      <StatusBar />
    </Box>
  );
}

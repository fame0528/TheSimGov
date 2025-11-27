/**
 * @file app/(game)/politics/page.tsx
 * @description Politics and elections page
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Politics page for running campaigns and viewing elections.
 * Placeholder for future political features.
 * 
 * ROUTE: /politics
 * PROTECTION: Requires authentication
 */

import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { Box, Text, VStack } from '@chakra-ui/react';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import SectionCard from '@/components/ui/SectionCard';

export default async function PoliticsPage() {
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
          <SectionCard title="Politics" iconClass="fa-solid fa-landmark-flag">
            <Text color="subtext" fontSize="lg">Run for office and shape policy</Text>
          </SectionCard>

          <SectionCard title="Coming Soon" iconClass="fa-solid fa-gavel">
            <Text color="subtext" fontSize="md">
              Political campaign and election features coming soon in Sprint 4.
            </Text>
            <Text color="ash_gray.700" fontSize="sm" mt={4}>
              Features will include:
            </Text>
            <VStack spacing={1} align="stretch" mt={2} fontSize="sm" color="ash_gray.700">
              <Text>• Run for local, state, and federal office</Text>
              <Text>• Campaign and fundraising</Text>
              <Text>• Vote on legislation</Text>
              <Text>• Build political influence</Text>
              <Text>• Form coalitions and parties</Text>
            </VStack>
          </SectionCard>
        </VStack>
      </Box>

      <StatusBar />
    </Box>
  );
}

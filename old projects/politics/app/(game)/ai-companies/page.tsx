/**
 * @file app/(game)/ai-companies/page.tsx
 * @description AI Companies index page
 */

'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Box, Heading, Text, VStack, HStack, Badge, Button, Spinner } from '@chakra-ui/react';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AICompaniesPage() {
  const { data: session, status } = useSession();
  const { data, error, isLoading } = useSWR('/api/ai/companies', fetcher);

  if (status === 'loading') return <Box minH="100vh" bg="night.500" />;
  if (!session?.user) return null;

  return (
    <Box minH="100vh" bg="night.500">
      <TopMenu user={session.user} />
      <Box px={6} py={6} pb={20}>
        <VStack spacing={6} align="stretch" maxW="960px" mx="auto">
          <Heading color="white">AI Companies</Heading>
          <Text color="ash_gray.400">Technology industry companies you own.</Text>

          {isLoading && (
            <HStack color="ash_gray.400"><Spinner size="sm" /> <Text>Loading...</Text></HStack>
          )}
          {error && <Text color="red_cmyk.500">Failed to load companies</Text>}

          <VStack spacing={4} align="stretch">
            {data?.companies?.map((c: any) => (
              <Box key={c._id} p={5} bg="night.400" borderRadius="xl" border="1px solid" borderColor="ash_gray.800">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Heading size="md" color="white">{c.name}</Heading>
                      <Badge colorScheme="blue">{c.industry}</Badge>
                    </HStack>
                    <HStack spacing={6}>
                      <Text color="ash_gray.400">Cash: ${c.cash.toLocaleString()}</Text>
                      <Text color="ash_gray.400">Employees: {c.employees}</Text>
                      <Text color="ash_gray.400">Reputation: {c.reputation}</Text>
                    </HStack>
                  </VStack>
                  <Link href={`/ai-companies/${c._id}`}>
                    <Button bg="picton_blue.500" color="white" _hover={{ bg: 'picton_blue.600' }}>Open</Button>
                  </Link>
                </HStack>
              </Box>
            ))}
            {data?.companies?.length === 0 && (
              <Text color="ash_gray.400">No AI companies yet. Create a Technology company from Companies → New.</Text>
            )}
          </VStack>
        </VStack>
      </Box>
      <StatusBar />
    </Box>
  );
}

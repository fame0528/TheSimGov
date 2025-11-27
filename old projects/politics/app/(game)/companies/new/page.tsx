/**
 * @file app/(game)/companies/new/page.tsx
 * @description Company creation page
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Dedicated page for creating new companies.
 * Shows company creation form with industry selection.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import CompanyForm from '@/components/companies/CompanyForm';

export default function NewCompanyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCompanyCreated = () => {
    router.push('/companies');
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
        <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
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

          {/* Header */}
          <Box
            bg="night.400"
            p={8}
            borderRadius="2xl"
            borderWidth={1}
            borderColor="ash_gray.800"
          >
            <Heading as="h1" size="2xl" color="white" mb={3}>
              Create New Company
            </Heading>
            <Text color="ash_gray.400" fontSize="md">
              Start your entrepreneurial journey by founding a new company.
              Choose from 6 industries and receive $10,000 in seed capital.
            </Text>
          </Box>

          {/* Company Form */}
          <Box
            bg="night.400"
            p={8}
            borderRadius="2xl"
            borderWidth={1}
            borderColor="ash_gray.800"
          >
            <CompanyForm onSuccess={handleCompanyCreated} />
          </Box>
        </VStack>
      </Box>

      <StatusBar />
    </Box>
  );
}

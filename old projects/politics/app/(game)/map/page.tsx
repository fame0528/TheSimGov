/**
 * @file app/(game)/map/page.tsx
 * @description Interactive US map showing political control
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Visual interactive map of United States with color-coded states by party control.
 * Shows political landscape and allows state inspection.
 * 
 * ROUTE: /map
 * PROTECTION: Requires authentication
 */

import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { Box, Grid, GridItem, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import USMap from '@/components/map/USMap';
import { allStates } from '@/lib/seed';

export default async function MapPage() {
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
          {/* Header */}
          <Box
            bg="night.400"
            p={8}
            borderRadius="2xl"
            borderWidth={1}
            borderColor="ash_gray.800"
          >
            <Heading as="h1" size="2xl" color="white" mb={2}>
              United States Map
            </Heading>
            <Text color="ash_gray.600" fontSize="lg">
              Interactive political landscape - hover over states for details
            </Text>
            
            {/* Legend */}
            <HStack spacing={6} mt={6}>
              <HStack>
                <Box w="20px" h="20px" bg="red.500" borderRadius="sm" />
                <Text fontSize="sm" color="white">Republican Control</Text>
              </HStack>
              <HStack>
                <Box w="20px" h="20px" bg="blue.500" borderRadius="sm" />
                <Text fontSize="sm" color="white">Democratic Control</Text>
              </HStack>
              <HStack>
                <Box w="20px" h="20px" bg="purple.500" borderRadius="sm" />
                <Text fontSize="sm" color="white">Split Control</Text>
              </HStack>
              <HStack>
                <Box w="20px" h="20px" bg="ash_gray.600" borderRadius="sm" />
                <Text fontSize="sm" color="white">Uncontrolled (Player Vacant)</Text>
              </HStack>
            </HStack>
          </Box>

          {/* Interactive Map */}
          <Box
            bg="night.400"
            p={6}
            borderRadius="2xl"
            borderWidth={1}
            borderColor="ash_gray.800"
            h={{ base: '55vh', md: '65vh', lg: '70vh' }}
            overflow="hidden"
          >
            <USMap />
          </Box>

          {/* Summary Stats */}
          <Grid templateColumns="repeat(4, 1fr)" gap={4}>
            <GridItem>
              <Box
                bg="night.400"
                p={6}
                borderRadius="2xl"
                borderWidth={1}
                borderColor="ash_gray.800"
              >
                <Text fontSize="xs" color="ash_gray.600" mb={2}>
                  Total States
                </Text>
                <Heading size="lg" color="white">
                  51
                </Heading>
              </Box>
            </GridItem>

            <GridItem>
              <Box
                bg="night.400"
                p={6}
                borderRadius="2xl"
                borderWidth={1}
                borderColor="ash_gray.800"
              >
                <Text fontSize="xs" color="ash_gray.600" mb={2}>
                  Total Population
                </Text>
                <Heading size="lg" color="gold.500">
                  {(allStates.reduce((sum, s) => sum + s.population, 0) / 1_000_000).toFixed(0)}M
                </Heading>
              </Box>
            </GridItem>

            <GridItem>
              <Box
                bg="night.400"
                p={6}
                borderRadius="2xl"
                borderWidth={1}
                borderColor="ash_gray.800"
              >
                <Text fontSize="xs" color="ash_gray.600" mb={2}>
                  House Seats
                </Text>
                <Heading size="lg" color="picton_blue.500">
                  {allStates.reduce((sum, s) => sum + s.houseSeatCount, 0)}
                </Heading>
              </Box>
            </GridItem>

            <GridItem>
              <Box
                bg="night.400"
                p={6}
                borderRadius="2xl"
                borderWidth={1}
                borderColor="ash_gray.800"
              >
                <Text fontSize="xs" color="ash_gray.600" mb={2}>
                  Senate Seats
                </Text>
                <Heading size="lg" color="picton_blue.500">
                  100
                </Heading>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      </Box>

      <StatusBar />
    </Box>
  );
}

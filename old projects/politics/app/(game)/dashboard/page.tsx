/**
 * @file app/(game)/dashboard/page.tsx
 * @description Modern bento box dashboard design
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Modern dashboard with bento box layout, top menu, and status bar.
 * Full-page design with sticky navigation and metrics.
 * 
 * ROUTE: /dashboard
 * PROTECTION: Requires authentication (enforced by middleware)
 * 
 * FEATURES:
 * - Bento box grid layout
 * - Sticky top menu with navigation
 * - Fixed bottom status bar with metrics
 * - Modern card-based UI
 * - Responsive grid system
 * 
 * COLOR PALETTE:
 * - Primary: picton_blue (#00aef3)
 * - Background: night (#141414)
 * - Cards: night.400 (#1a1a1a)
 * - Text: white, ash_gray
 * - Accents: gold, red_cmyk
 */

import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { Box, Grid, GridItem, Heading, Text, VStack } from '@chakra-ui/react';
import KPIStat from '@/components/ui/KPIStat';
import TopPlayersTable from '@/components/ui/TopPlayersTable';
import MarketTrendsChart from '@/components/ui/MarketTrendsChart';
import SectionCard from '@/components/ui/SectionCard';
import QuickActionsOverlay from '@/components/ui/QuickActionsOverlay';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';

/**
 * Dashboard Page Component
 * 
 * @description
 * Modern bento box dashboard with full-page layout.
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <Box minH="100vh" bg="bg">
      {/* Top Menu */}
      <TopMenu user={user} />

      {/* Main Content with padding for top menu and bottom status bar */}
      <Box px={{ base: 4, md: 6 }} py={6} pb={20}>
        {/* Bento Box Grid */}
          <Grid templateColumns="repeat(12, 1fr)" gap={{ base: 4, md: 5 }} maxW="100vw">
          {/* Welcome Hero - Full Width */}
          <GridItem colSpan={12}>
            <Box layerStyle="card" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
              <Box position="relative" zIndex={1}>
                <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="white" mb={2}>
                  Welcome back, {user.firstName}!
                </Heading>
                <Text color="subtext" fontSize={{ base: 'md', md: 'lg' }}>
                  Your business empire awaits
                </Text>
              </Box>
              {/* Gradient Overlay */}
              <Box
                position="absolute"
                top={0}
                right={0}
                bottom={0}
                left={0}
                bgGradient="linear(to-br, transparent, picton_blue.800)"
                opacity={0.15}
              />
            </Box>
          </GridItem>

          {/* Removed Profile Card as requested */}

          {/* Quick Stats - 8 cols */}
          <GridItem colSpan={{ base: 12, md: 8 }}>
            <Grid templateColumns="repeat(3, 1fr)" gap={4} h="full">
              <GridItem>
                <KPIStat label="Cash on Hand" value="$0" color="gold.500" iconClass="fa-solid fa-sack-dollar" />
              </GridItem>
              <GridItem>
                <KPIStat label="Companies Owned" value="0" color="picton_blue.500" iconClass="fa-solid fa-briefcase" />
              </GridItem>
              <GridItem>
                <KPIStat label="Political Office" value="None" color="white" iconClass="fa-solid fa-landmark" />
              </GridItem>
            </Grid>
          </GridItem>

          {/* Recent Activity - now full width */}
          <GridItem colSpan={{ base: 12, md: 12 }}>
            <SectionCard title="Recent Activity" iconClass="fa-solid fa-clock-rotate-left">
              <VStack spacing={3} align="stretch" h="300px">
                <Text color="subtext" fontSize="sm">
                  No recent activity
                </Text>
              </VStack>
            </SectionCard>
          </GridItem>

          {/* Quick Actions removed from grid; floating overlay will handle them */}

          {/* Leaderboard - match height of Market Trends */}
          <GridItem colSpan={{ base: 12, md: 6 }} minW="0">
            <TopPlayersTable />
          </GridItem>

          {/* Market Trends - 6 cols */}
          <GridItem colSpan={{ base: 12, md: 6 }} minW="0">
            <MarketTrendsChart />
          </GridItem>
        </Grid>
        {/* Floating Quick Actions overlay */}
        <QuickActionsOverlay
          actions={[
            { label: 'Create a company', icon: 'fa-solid fa-building' },
            { label: 'Run for office', icon: 'fa-solid fa-person-chalkboard' },
            { label: 'View market', icon: 'fa-solid fa-chart-line' },
            { label: 'Manage employees', icon: 'fa-solid fa-people-group' },
          ]}
        />
      </Box>

      {/* Bottom Status Bar */}
      <StatusBar />
    </Box>
  );
}

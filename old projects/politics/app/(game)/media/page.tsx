/**
 * @file app/(game)/media/page.tsx
 * @description Main Media Industry dashboard integrating all Media company features
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Unified Media company interface combining influencer marketing, brand sponsorships,
 * advertising campaigns, and monetization configuration. Provides comprehensive
 * dashboard for Media companies to manage content creation, partnerships, advertising,
 * and revenue optimization strategies.
 * 
 * FEATURES:
 * - Tabbed interface for different Media functions
 * - Influencer Marketplace: Browse and hire influencers for sponsored content
 * - Sponsorship Dashboard: Track brand partnership deals and deliverables
 * - Ad Campaign Builder: Create multi-platform advertising campaigns
 * - Monetization Settings: Configure CPM rates and revenue strategies
 * - Quick stats overview: Influencer count, sponsorships, campaign spend, revenue
 * - Responsive design for all devices
 * 
 * USAGE:
 * Navigate to /media in-game to access Media Industry features
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
  useToast,
  VStack,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import InfluencerMarketplace from '@/src/components/media/InfluencerMarketplace';
import SponsorshipDashboard from '@/src/components/media/SponsorshipDashboard';
import AdCampaignBuilder from '@/src/components/media/AdCampaignBuilder';
import MonetizationSettings from '@/src/components/media/MonetizationSettings';
import { useDisclosure } from '@chakra-ui/react';

/**
 * MediaPage component
 * 
 * @description
 * Main dashboard for Media Industry companies, integrating influencer marketing,
 * sponsorships, advertising campaigns, and monetization configuration
 * 
 * @returns {JSX.Element} Media dashboard page
 */
export default function MediaPage() {
  const { data: session, status } = useSession();
  const toast = useToast();
  const { isOpen: isAdBuilderOpen, onClose: onAdBuilderClose } = useDisclosure();

  // Company state
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);

  // Stats state
  const [stats, setStats] = useState({
    totalInfluencers: 0,
    activeSponsorships: 0,
    totalCampaignSpend: 0,
    monthlyRevenue: 0,
    loading: true,
  });

  /**
   * Fetch user's Media company on mount
   */
  useEffect(() => {
    const fetchCompany = async () => {
      if (status !== 'authenticated' || !session?.user?.id) return;

      setLoading(true);
      try {
        // Fetch user's companies
        const res = await fetch('/api/companies/my-companies');
        if (res.ok) {
          const data = await res.json();
          
          // Find Media industry company
          const mediaCompany = data.companies?.find((c: any) => c.industry === 'Media');
          
          if (mediaCompany) {
            setCompany(mediaCompany);
          }
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        toast({
          title: 'Error loading company',
          description: 'Unable to fetch company data',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [session, status, toast]);

  /**
   * Fetch Media dashboard stats
   */
  useEffect(() => {
    const fetchStats = async () => {
      if (!company) return;

      setStats({ ...stats, loading: true });

      try {
        // Fetch influencer deals
        const influencersRes = await fetch('/api/media/influencers');
        const influencersData = await influencersRes.json();

        // Fetch sponsorship deals
        const sponsorshipsRes = await fetch('/api/media/sponsorships');
        const sponsorshipsData = await sponsorshipsRes.json();

        // Fetch ad campaigns (using E-Commerce ads endpoint)
        const adsRes = await fetch('/api/ecommerce/ads');
        const adsData = await adsRes.json();

        // Fetch monetization settings
        const monetizationRes = await fetch(`/api/media/monetization?companyId=${company._id}`);
        const monetizationData = await monetizationRes.json();

        // Calculate stats
        const totalInfluencers = influencersData.deals?.length || 0;
        const activeSponsorships = sponsorshipsData.meta?.active || 0;
        const totalCampaignSpend = adsData.campaigns?.reduce(
          (sum: number, campaign: any) => sum + (campaign.budget || 0),
          0
        ) || 0;
        const monthlyRevenue = monetizationData.subscriptionRevenue || 0;

        setStats({
          totalInfluencers,
          activeSponsorships,
          totalCampaignSpend,
          monthlyRevenue,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({ ...stats, loading: false });
      }
    };

    if (company) {
      fetchStats();
    }
  }, [company]);

  /**
   * Render loading state
   */
  if (status === 'loading' || loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={4}>Loading Media dashboard...</Text>
        </Box>
      </Container>
    );
  }

  /**
   * Render unauthenticated state
   */
  if (status === 'unauthenticated') {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Please sign in to access Media features.
        </Alert>
      </Container>
    );
  }

  /**
   * Render no company state
   */
  if (!company) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">No Media Company Found</Text>
            <Text fontSize="sm" mt={1}>
              Create a Media industry company to access influencer marketing, sponsorships, advertising, and monetization features.
            </Text>
          </Box>
        </Alert>
      </Container>
    );
  }

  /**
   * Render main dashboard
   */
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl">Media Industry Dashboard</Heading>
          <Text color="gray.600" mt={2}>
            {company.name} - Level {company.level}
          </Text>
        </Box>

        {/* Quick Stats Overview */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Influencer Deals</StatLabel>
                <StatNumber>{stats.loading ? '-' : stats.totalInfluencers}</StatNumber>
                <StatHelpText>Active partnerships</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Sponsorships</StatLabel>
                <StatNumber>{stats.loading ? '-' : stats.activeSponsorships}</StatNumber>
                <StatHelpText>Active brand deals</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Campaign Spend</StatLabel>
                <StatNumber>
                  {stats.loading ? '-' : `$${stats.totalCampaignSpend.toLocaleString()}`}
                </StatNumber>
                <StatHelpText>Total ad budget</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Monthly Revenue</StatLabel>
                <StatNumber color="green.500">
                  {stats.loading ? '-' : `$${stats.monthlyRevenue.toLocaleString()}`}
                </StatNumber>
                <StatHelpText>MRR + ARR/12</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Main Tabs */}
        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>Influencer Marketplace</Tab>
            <Tab>Sponsorships</Tab>
            <Tab>Ad Campaigns</Tab>
            <Tab>Monetization</Tab>
          </TabList>

          <TabPanels>
            {/* Influencer Marketplace Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    Influencer Marketplace
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Browse and hire influencers for sponsored content campaigns. Filter by niche, followers, and engagement rate.
                  </Text>
                </Box>
                <InfluencerMarketplace
                  companyId={company._id}
                  onSuccess={() => {
                    toast({
                      title: 'Deal created',
                      description: 'Influencer hired successfully',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                />
              </VStack>
            </TabPanel>

            {/* Sponsorships Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    Brand Sponsorships
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Manage brand partnership deals, track deliverables, and monitor performance metrics.
                  </Text>
                </Box>
                <SponsorshipDashboard companyId={company._id} />
              </VStack>
            </TabPanel>

            {/* Ad Campaigns Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    Advertising Campaigns
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Create multi-platform ad campaigns with demographic targeting and ROAS tracking.
                  </Text>
                </Box>
                <AdCampaignBuilder
                  isOpen={isAdBuilderOpen}
                  onClose={onAdBuilderClose}
                  companyId={company._id}
                  onSuccess={() => {
                    toast({
                      title: 'Campaign created',
                      description: 'Ad campaign launched successfully',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                />
              </VStack>
            </TabPanel>

            {/* Monetization Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    Monetization Settings
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Configure CPM rates, revenue strategies, and demographic multipliers to optimize earnings.
                  </Text>
                </Box>
                <MonetizationSettings companyId={company._id} />
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}


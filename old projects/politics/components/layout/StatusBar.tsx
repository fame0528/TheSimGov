/**
 * @file components/layout/StatusBar.tsx
 * @description Bottom status bar for dashboard
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Pinned status bar showing key metrics and game state.
 * Always visible at bottom of viewport.
 * Fetches real-time company data from API.
 * 
 * COLOR PALETTE:
 * - Background: night.400 (#1a1a1a)
 * - Text: white, ash_gray
 * - Accents: gold, picton_blue
 */

'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, HStack, Text, Divider } from '@chakra-ui/react';

interface CompanyStats {
  count: number;
  totalCash: number;
  totalNetWorth: number;
}

export default function StatusBar() {
  const [companyStats, setCompanyStats] = useState<CompanyStats>({
    count: 0,
    totalCash: 0,
    totalNetWorth: 0,
  });

  // Fetch company stats
  useEffect(() => {
    const fetchCompanyStats = async () => {
      try {
        const response = await fetch('/api/companies?limit=100');
        if (response.ok) {
          const data = await response.json();
          const totalCash = data.companies.reduce((sum: number, c: any) => sum + (c.cash || 0), 0);
          const totalNetWorth = data.companies.reduce((sum: number, c: any) => sum + (c.netWorth || c.cash || 0), 0);
          
          setCompanyStats({
            count: data.companies.length,
            totalCash,
            totalNetWorth,
          });
        }
      } catch (error) {
        console.error('Failed to fetch company stats:', error);
      }
    };

    fetchCompanyStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCompanyStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Box
      id="status-bar"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={100}
      layerStyle="glass"
      borderTopWidth={1}
    >
      <Flex
        maxW="100vw"
        px={6}
        py={3}
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Left: Cash & Assets */}
        <HStack spacing={6} divider={<Divider orientation="vertical" borderColor="ash_gray.800" h="20px" />}>
          <HStack spacing={2}>
            <Text fontSize="xs" color="subtext">
              Cash:
            </Text>
            <Text fontSize="sm" color="gold.500" fontWeight="bold">
              {formatCurrency(companyStats.totalCash)}
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Text fontSize="xs" color="subtext">
              Net Worth:
            </Text>
            <Text fontSize="sm" color="gold.500" fontWeight="bold">
              {formatCurrency(companyStats.totalNetWorth)}
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Text fontSize="xs" color="subtext">
              Companies:
            </Text>
            <Text fontSize="sm" color="white" fontWeight="medium">
              {companyStats.count}
            </Text>
          </HStack>
        </HStack>

        {/* Center: Game Time */}
        <HStack spacing={2}>
          <Text fontSize="xs" color="subtext">
            Game Date:
          </Text>
          <Text fontSize="sm" color="picton_blue.500" fontWeight="medium">
            Jan 1, 2025
          </Text>
        </HStack>

        {/* Right: Political Status */}
        <HStack spacing={6} divider={<Divider orientation="vertical" borderColor="ash_gray.800" h="20px" />}>
          <HStack spacing={2}>
            <Text fontSize="xs" color="subtext">
              Political Office:
            </Text>
            <Text fontSize="sm" color="white" fontWeight="medium">
              None
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Text fontSize="xs" color="subtext">
              Influence:
            </Text>
            <Text fontSize="sm" color="picton_blue.500" fontWeight="medium">
              0
            </Text>
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
}

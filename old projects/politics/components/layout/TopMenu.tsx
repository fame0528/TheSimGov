/**
 * @file components/layout/TopMenu.tsx
 * @description Top navigation menu for dashboard
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Modern top menu bar with user info, navigation, and actions.
 * Sticky positioning for always-visible navigation.
 * 
 * COLOR PALETTE:
 * - Background: night.400 (#1a1a1a)
 * - Text: white, ash_gray
 * - Accents: picton_blue, gold
 */

'use client';

import { Box, Flex, Text, Button, Avatar, HStack } from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface TopMenuProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    state: string;
  };
}

export default function TopMenu({ user }: TopMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'fa-solid fa-gauge' },
    { label: 'Companies', path: '/companies', icon: 'fa-solid fa-briefcase' },
    { label: 'Media', path: '/media', icon: 'fa-solid fa-video' },
    { label: 'Politics', path: '/politics', icon: 'fa-solid fa-landmark-flag' },
    { label: 'Market', path: '/market', icon: 'fa-solid fa-chart-line' },
    { label: 'Map', path: '/map', icon: 'fa-solid fa-map-location-dot' },
  ];

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={100}
      layerStyle="glass"
      borderBottomWidth={1}
    >
      <Flex
        maxW="100vw"
        px={6}
        py={4}
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Logo / Title */}
        <HStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Business & Politics
          </Text>
          <Text fontSize="sm" color="ash_gray.600">
            MMO Simulation
          </Text>
        </HStack>

        {/* Navigation */}
        <HStack spacing={6}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              color={pathname === item.path ? 'brand' : 'subtext'}
              bg={pathname === item.path ? 'night.500' : 'transparent'}
              _hover={{ color: 'brand', bg: 'night.500' }}
              onClick={() => router.push(item.path)}
              leftIcon={<i className={item.icon} aria-hidden="true" />}
            >
              {item.label}
            </Button>
          ))}
        </HStack>

        {/* User Section */}
        <HStack spacing={4}>
          <Box textAlign="right">
            <Text fontSize="sm" color="white" fontWeight="medium">
              {user.firstName} {user.lastName}
            </Text>
            <Text fontSize="xs" color="gold.500">
              {user.state}
            </Text>
          </Box>
          <Avatar
            size="sm"
            name={`${user.firstName} ${user.lastName}`}
            bg="picton_blue.500"
          />
          <Button
            size="sm"
            variant="outline"
            borderColor="red_cmyk.500"
            color="red_cmyk.500"
            _hover={{ bg: 'red_cmyk.500', color: 'white' }}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign Out
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}

"use client";

import { Box, Button, HStack, VStack, Text } from "@chakra-ui/react";

export interface ActionItem {
  label: string;
  icon: string; // Font Awesome class
  onClick?: () => void;
}

interface QuickActionsProps {
  title?: string;
  headerIcon?: string;
  actions: ActionItem[];
}

export default function QuickActions({ title = "Quick Actions", headerIcon = "fa-solid fa-bolt", actions }: QuickActionsProps) {
  return (
    <Box layerStyle="card" p={6}>
      <HStack spacing={3} mb={4} align="center">
        <Box as="i" className={headerIcon} color="brand" fontSize="md" lineHeight="1" aria-hidden="true" />
        <Text as="h3" fontSize="md" color="white" fontWeight="semibold">
          {title}
        </Text>
      </HStack>
      <VStack spacing={3} align="stretch">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            justifyContent="flex-start"
            leftIcon={<Box as="i" className={a.icon} color="brand" fontSize="sm" lineHeight="1" aria-hidden="true" />}
            onClick={a.onClick}
          >
            {a.label}
          </Button>
        ))}
      </VStack>
      {/* Floating overlay not supported here — use QuickActionsOverlay */}
    </Box>
  );
}

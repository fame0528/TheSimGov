"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  iconClass?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  id?: string;
}

export default function SectionCard({ title, iconClass, children, rightSlot, id }: SectionCardProps) {
  return (
    <Box id={id} layerStyle="card" p={6} minW="0">
      <HStack justify="space-between" mb={4} align="center">
        <HStack spacing={3} align="center">
          {iconClass ? (
            <Box as="i" className={iconClass} color="brand" fontSize="md" lineHeight="1" aria-hidden="true" />
          ) : null}
          <Text as="h3" fontSize="md" color="white" fontWeight="semibold">
            {title}
          </Text>
        </HStack>
        {rightSlot}
      </HStack>
      {children}
    </Box>
  );
}

"use client";

import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, HStack, Text } from "@chakra-ui/react";
import SectionCard from '@/components/ui/SectionCard';

interface PlayerRow {
  name: string;
  state: string;
  companies: number;
  netWorth: number;
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export default function TopPlayersTable({ rows = [] as PlayerRow[] }) {
  const data = rows.length
    ? rows
    : [
        { name: "Fame Johnson", state: "KY", companies: 1, netWorth: 10000 },
        { name: "Alex Smith", state: "CA", companies: 2, netWorth: 25000 },
      ];

  return (
    <SectionCard title="Top Players" iconClass="fa-solid fa-trophy">
      {/* Match MarketTrendsChart height for consistent layout */}
      <Box h="240px" overflowY="auto">
        <TableContainer h="100%">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th color="subtext">Player</Th>
              <Th color="subtext">State</Th>
              <Th isNumeric color="subtext">Companies</Th>
              <Th isNumeric color="subtext">Net Worth</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((p) => (
              <Tr key={`${p.name}-${p.state}`} _hover={{ bg: "night.500" }}>
                <Td>
                  <HStack>
                    <Badge colorScheme="blue">PRO</Badge>
                    <Text color="white">{p.name}</Text>
                  </HStack>
                </Td>
                <Td><Badge colorScheme="yellow">{p.state}</Badge></Td>
                <Td isNumeric color="white">{p.companies}</Td>
                <Td isNumeric color="gold.500" fontWeight="bold">{formatCurrency(p.netWorth)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        </TableContainer>
      </Box>
    </SectionCard>
  );
}

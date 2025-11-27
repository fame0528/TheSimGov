/**
 * @file app/providers.tsx
 * @description Client-side providers wrapper
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Client component that wraps the application with necessary providers.
 * Includes SessionProvider for NextAuth authentication state.
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/src/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </SessionProvider>
  );
}

/**
 * @fileoverview Client-Side Providers
 * @module app/providers
 * 
 * OVERVIEW:
 * Wraps the application with necessary client-side providers.
 * Includes HeroUI theming, NextAuth session, and SWR configuration.
 * 
 * @created 2025-11-20
 * @updated 2025-11-21 - Migrated from Chakra UI to HeroUI
 * @author ECHO v1.1.0
 */

'use client';

import { HeroUIProvider } from '@heroui/react';
import { SWRConfig } from 'swr';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers - Client-side context providers
 * 
 * Wraps application with:
 * - NextAuth SessionProvider for authentication
 * - HeroUI theming and component context
 * - SWR configuration for data fetching
 * 
 * @param children - Application content to wrap
 * @returns Wrapped application with all providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            dedupingInterval: 2000,
          }}
        >
          {children}
        </SWRConfig>
      </HeroUIProvider>
    </SessionProvider>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Client Component**: Must be 'use client' for context providers
 * 2. **Provider Order**: SessionProvider → HeroUIProvider → SWRConfig
 * 3. **HeroUI**: Provides theming, component library, dark mode support
 * 4. **SWR Config**: Global configuration for all data fetching hooks
 * 5. **Composition**: Root layout imports this to wrap {children}
 * 6. **Theme**: Dark/light mode controlled via className on <html> element
 */

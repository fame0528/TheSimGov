/**
 * @file src/types/next-auth.d.ts
 * @description NextAuth type extensions for custom session fields
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * TypeScript module augmentation for NextAuth types.
 * Extends default Session and JWT types with custom user fields.
 * Provides type safety for firstName, lastName, state fields.
 * 
 * USAGE:
 * Import automatically when using NextAuth in TypeScript files.
 * No explicit import needed - TypeScript picks up declarations automatically.
 * 
 * @example
 * ```typescript
 * import { auth } from '@/lib/auth/config';
 * 
 * const session = await auth();
 * // TypeScript knows about session.user.firstName, lastName, state
 * console.log(session.user.firstName); // ✅ Type-safe
 * ```
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended Session interface
   * 
   * @description
   * Adds custom fields to the default NextAuth session.
   * Includes MongoDB user ID and profile fields.
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      state: string;
      companyId?: string;
    };
  }

  /**
   * Extended User interface
   * 
   * @description
   * Adds custom fields to the default NextAuth user type.
   * Used during sign in and user creation.
   */
  interface User {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    state: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   * 
   * @description
   * Adds custom fields to JWT token payload.
   * Includes user ID and profile fields for session persistence.
   */
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    state: string;
  }
}

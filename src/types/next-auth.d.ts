/**
 * @fileoverview NextAuth.js type declarations
 * @description Extends NextAuth types with custom user properties
 * @version 1.0.0
 * @created 2025-11-25
 */

import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      companyId?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    companyId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    companyId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }
}

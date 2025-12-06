/**
 * @fileoverview NextAuth v5 Configuration
 * @module auth
 * 
 * OVERVIEW:
 * NextAuth.js v5 configuration with credentials provider.
 * Handles authentication, session management, and JWT tokens.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import NextAuth, { type User as NextAuthUser, type Session, type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import { compare } from 'bcryptjs';
import User from '@/lib/db/models/User';
import type { JWT } from 'next-auth/jwt';

// Simple in-memory rate limiter for credentials login (dev-safe)
// Limits failed attempts per IP within a short window.
const loginAttempts = new Map<string, { count: number; first: number }>();
const MAX_ATTEMPTS = 5; // allowed attempts
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  // Reset window if expired
  if (now - entry.first > WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) {
    loginAttempts.set(key, { count: 1, first: now });
  } else {
    // Reset window if expired, else increment
    if (now - entry.first > WINDOW_MS) {
      loginAttempts.set(key, { count: 1, first: now });
    } else {
      entry.count += 1;
      loginAttempts.set(key, entry);
    }
  }
}

function recordSuccess(key: string): void {
  // Clear attempts on success
  loginAttempts.delete(key);
}

/**
 * NextAuth v5 Configuration
 * 
 * USAGE:
 * - API Route: Import { GET, POST } from this file
 * - Middleware: Use auth() for session checking
 * - Components: Use useSession() from next-auth/react
 * 
 * @example
 * ```ts
 * // In app/api/auth/[...nextauth]/route.ts
 * export { GET, POST } from '@/auth';
 * 
 * // In middleware.ts
 * import { auth } from '@/auth';
 * export default auth((req) => {
 *   if (!req.auth && req.nextUrl.pathname !== '/login') {
 *     return Response.redirect(new URL('/login', req.url));
 *   }
 * });
 * 
 * // In components
 * import { useSession } from 'next-auth/react';
 * const { data: session } = useSession();
 * ```
 */
const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing credentials');
          return null;
        }

        try {
          // Rate limit on IP or email key
          // In NextAuth authorize(), request is not directly available;
          // use email as a best-effort key. For production, use middleware with IP.
          const rateKey = `cred:${credentials.email}`;
          if (isRateLimited(rateKey)) {
            throw new Error('RateLimit');
          }

          await connectDB();

          // Find user by email
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.error('[Auth] User not found:', credentials.email);
            recordFailure(rateKey);
            return null;
          }

          // Verify password
          const isValid = await compare(
            credentials.password as string,
            user.password as string
          );

          if (!isValid) {
            console.error('[Auth] Invalid password for:', credentials.email);
            recordFailure(rateKey);
            return null;
          }

          // Block login if registration not complete (missing mandatory fields)
          const missing: string[] = [];
          if (!user.gender) missing.push('gender');
          if (!user.ethnicity) missing.push('ethnicity');
          if (!user.dateOfBirth) missing.push('dateOfBirth');
          if (!user.imageUrl) missing.push('imageUrl');
          if (missing.length > 0) {
            // Provide a friendly error instead of raw Mongoose validation
            throw new Error(
              `Registration incomplete: please fill ${missing.join(', ')} on the registration page.`
            );
          }

          // Update last login without triggering full validation
          await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }, { strict: false });

          // Convert Mongoose document to plain object for NextAuth
          const userObj = user.toObject();

          console.log('[Auth] Login successful:', credentials.email);
          recordSuccess(rateKey);

          // Return user object (will be stored in JWT)
          return {
            id: userObj._id.toString(),
            email: userObj.email,
            name: userObj.username,
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            state: userObj.state,
            username: userObj.username,
            createdAt: userObj.createdAt,
            companies: userObj.companies || [],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Authentication error';
          console.error('Auth error:', message);
          // NextAuth v5: return null yields generic error; throw gives a clearer error route
          throw new Error(message);
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Only enable debug when explicitly requested via DEBUG_AUTH env var
  // This avoids noisy warnings in development mode
  debug: process.env.DEBUG_AUTH === 'true',
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session from token
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  // Use AUTH_SECRET (NextAuth v5 standard) with fallback to NEXTAUTH_SECRET
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Required for Vercel/production deployments - trust the host header
  trustHost: true,
};

export const authOptions = authConfig;
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Export handlers for API routes
export const { GET, POST } = handlers;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **NextAuth v5**: Uses new App Router pattern
 * 2. **Credentials**: Email/password authentication with real User model
 * 3. **JWT**: Stateless session management
 * 4. **Secure**: Password hashing with bcrypt, lastLogin tracking
 * 5. **Database**: MongoDB via Mongoose with connection pooling
 * 
 * TODO:
 * - Add user registration logic
 * - Implement password reset flow
 * - Add OAuth providers (Google, GitHub, etc.)
 * - Add rate limiting for failed login attempts
 * 
 * PREVENTS:
 * - Insecure authentication patterns
 * - Session management bugs
 * - Duplicate auth configuration
 * - Placeholder/mock authentication code
 */

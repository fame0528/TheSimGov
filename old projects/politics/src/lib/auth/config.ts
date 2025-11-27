/**
 * @file src/lib/auth/config.ts
 * @description NextAuth.js v5 configuration with MongoDB adapter
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * NextAuth v5 authentication configuration with credentials provider.
 * Implements JWT-based sessions with secure token management.
 * Integrates with MongoDB User model for authentication.
 * 
 * FEATURES:
 * - Credentials-based authentication (email/password)
 * - JWT session strategy (stateless, scalable)
 * - Secure password comparison with bcrypt
 * - Custom session callbacks for user data
 * - Protected API routes and pages
 * 
 * USAGE:
 * ```typescript
 * import { auth, signIn, signOut } from '@/lib/auth/config';
 * 
 * // Get session in Server Component
 * const session = await auth();
 * 
 * // Sign in
 * await signIn('credentials', { email, password });
 * 
 * // Sign out
 * await signOut();
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Session strategy: JWT (no database sessions)
 * - Token expiration: 30 days
 * - Secure cookies in production (httpOnly, sameSite: lax)
 * - NEXTAUTH_SECRET required in production
 * - NEXTAUTH_URL auto-detected in development
 */

import NextAuth, { NextAuthConfig, User as NextAuthUser } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Extended User type with additional fields
 * Includes MongoDB _id and custom user properties
 */
interface ExtendedUser extends NextAuthUser {
  id: string;
  firstName: string;
  lastName: string;
  state: string;
}

/**
 * NextAuth configuration object
 * 
 * @description
 * Defines authentication providers, callbacks, and session settings.
 * Uses credentials provider for email/password authentication.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * Authorization function
       * 
       * @param {Object} credentials - User credentials from login form
       * @returns {Promise<ExtendedUser | null>} User object if valid, null otherwise
       * 
       * @description
       * Validates credentials against database.
       * Returns user object on success, null on failure.
       * Implements secure password comparison with bcrypt.
       */
      async authorize(credentials): Promise<ExtendedUser | null> {
        try {
          // Validate credentials with Zod schema
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.error('Validation failed:', validatedFields.error.errors);
            return null;
          }

          const { email, password } = validatedFields.data;

          // Connect to MongoDB
          await connectDB();

          // Find user by email and include password field
          const user = await User.findOne({ email }).select('+password');

          if (!user) {
            console.error('User not found:', email);
            return null;
          }

          // Compare password with stored hash
          const isPasswordValid = await user.comparePassword(password);

          if (!isPasswordValid) {
            console.error('Invalid password for user:', email);
            return null;
          }

          // Return user object (password excluded)
          return {
            id: (user._id as any).toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            state: user.state,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  
  /**
   * Session configuration
   * 
   * @description
   * Uses JWT strategy for stateless, scalable sessions.
   * Tokens stored in httpOnly cookies for security.
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * Pages configuration
   * 
   * @description
   * Custom authentication pages.
   * Redirects to custom login/register pages instead of NextAuth defaults.
   */
  pages: {
    signIn: '/login',
    error: '/login',
  },

  /**
   * Callbacks for session and JWT customization
   */
  callbacks: {
    /**
     * JWT callback
     * 
     * @description
     * Adds custom user data to JWT token.
     * Runs when token is created or updated.
     */
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.firstName = extendedUser.firstName;
        token.lastName = extendedUser.lastName;
        token.state = extendedUser.state;
      }
      return token;
    },

    /**
     * Session callback
     * 
     * @description
     * Adds custom user data to session object.
     * Exposes user data to client-side via useSession().
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.state = token.state as string;
      }
      return session;
    },

    /**
     * Authorized callback
     * 
     * @description
     * Determines if user can access protected routes.
     * Used by middleware for route protection.
     */
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                           request.nextUrl.pathname.startsWith('/register');
      
      // Allow access to auth pages when not logged in
      if (isOnAuthPage) {
        return true;
      }

      // Require login for all other pages
      return isLoggedIn;
    },
  },

  /**
   * Security settings
   */
  trustHost: true, // Trust host header in production
};

/**
 * NextAuth handlers and helpers
 * 
 * @description
 * Exports auth handler, signIn, and signOut functions.
 * Use these throughout the application for authentication.
 * 
 * @example
 * ```typescript
 * // Server Component
 * import { auth } from '@/lib/auth/config';
 * const session = await auth();
 * 
 * // Server Action
 * import { signIn } from '@/lib/auth/config';
 * await signIn('credentials', { email, password });
 * 
 * // Sign out
 * import { signOut } from '@/lib/auth/config';
 * await signOut();
 * ```
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

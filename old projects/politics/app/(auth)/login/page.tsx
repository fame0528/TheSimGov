/**
 * @file app/(auth)/login/page.tsx
 * @description Login page with centered form layout
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Public login page with LoginForm component.
 * Uses centered layout with dark background.
 * Implements responsive design for all screen sizes.
 * 
 * ROUTE: /login
 * 
 * LAYOUT:
 * - Centered vertically and horizontally
 * - Full viewport height
 * - Dark night background
 * - Responsive padding
 * 
 * USAGE:
 * Navigate to /login to access login form.
 * 
 * @example
 * ```typescript
 * // Automatic routing via Next.js App Router
 * // User visits: http://localhost:3000/login
 * ```
 */

import { Box, Container, Center } from '@chakra-ui/react';
import LoginForm from '@/components/auth/LoginForm';

/**
 * Login Page Component
 * 
 * @description
 * Public page for user authentication.
 * Renders LoginForm with centered layout.
 * 
 * @example
 * ```typescript
 * // Automatically rendered at /login route
 * ```
 */
export default function LoginPage() {
  return (
    <Box
      minH="100vh"
      bg="night.500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
    >
      <Container maxW="container.sm">
        <Center>
          <LoginForm />
        </Center>
      </Container>
    </Box>
  );
}

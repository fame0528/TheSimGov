/**
 * @file app/(auth)/register/page.tsx
 * @description Registration page with centered form layout
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Public registration page with RegisterForm component.
 * Uses centered layout with dark background.
 * Implements responsive design for all screen sizes.
 * 
 * ROUTE: /register
 * 
 * LAYOUT:
 * - Centered vertically and horizontally
 * - Full viewport height
 * - Dark night background
 * - Responsive padding
 * 
 * USAGE:
 * Navigate to /register to access registration form.
 * 
 * @example
 * ```typescript
 * // Automatic routing via Next.js App Router
 * // User visits: http://localhost:3000/register
 * ```
 */

import { Box, Container, Center } from '@chakra-ui/react';
import RegisterForm from '@/components/auth/RegisterForm';

/**
 * Register Page Component
 * 
 * @description
 * Public page for new user registration.
 * Renders RegisterForm with centered layout.
 * 
 * @example
 * ```typescript
 * // Automatically rendered at /register route
 * ```
 */
export default function RegisterPage() {
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
          <RegisterForm />
        </Center>
      </Container>
    </Box>
  );
}

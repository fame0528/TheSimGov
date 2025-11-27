/**
 * @file components/auth/LoginForm.tsx
 * @description Login form component with NextAuth integration
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Client-side login form with NextAuth credentials provider.
 * Handles authentication, error display, and redirect logic.
 * Uses custom color palette for consistent branding.
 * 
 * FEATURES:
 * - Email/password authentication
 * - Real-time validation with Zod
 * - Error message display with custom colors
 * - Loading states during submission
 * - Automatic redirect on success
 * - Remember me functionality (persistent session)
 * 
 * USAGE:
 * ```typescript
 * import LoginForm from '@/components/auth/LoginForm';
 * 
 * export default function LoginPage() {
 *   return <LoginForm />;
 * }
 * ```
 * 
 * COLOR PALETTE:
 * - Primary: picton_blue (#00aef3) - Submit button, links
 * - Error: red_cmyk (#e81b23) - Validation errors
 * - Neutral: ash_gray (#b2beb5) - Borders, disabled states
 * - Background: night (#141414) - Form background
 * - Text: white (#ffffff) - Primary text
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  FormErrorMessage,
  useToast,
  Link as ChakraLink,
} from '@chakra-ui/react';
import Link from 'next/link';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Login form state interface
 */
interface FormData {
  email: string;
  password: string;
}

/**
 * Form errors interface
 */
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * LoginForm Component
 * 
 * @description
 * Handles user login with NextAuth credentials provider.
 * Validates input and displays errors with custom styling.
 * 
 * @example
 * ```typescript
 * <LoginForm />
 * ```
 */
export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  // Error state
  const [errors, setErrors] = useState<FormErrors>({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input change
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input event
   * 
   * @description
   * Updates form data and clears field error on change.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle form submission
   * 
   * @param {React.FormEvent} e - Form event
   * 
   * @description
   * Validates form data, authenticates with NextAuth,
   * then redirects to dashboard on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form data with Zod
      const validatedData = loginSchema.parse(formData);

      // Sign in with NextAuth
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (result?.error) {
        // Authentication failed
        setErrors({ 
          general: 'Invalid email or password. Please try again.' 
        });
        return;
      }

      if (result?.ok) {
        // Authentication successful
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh(); // Refresh to update session
      }

    } catch (error: any) {
      // Handle Zod validation errors
      if (error.errors) {
        const zodErrors: FormErrors = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          zodErrors[field as keyof FormErrors] = err.message;
        });
        setErrors(zodErrors);
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="night.500"
      p={8}
      borderRadius="lg"
      borderWidth={1}
      borderColor="ash_gray.400"
      maxW="md"
      w="full"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
          Login
        </Text>

        {errors.general && (
          <Box
            p={3}
            bg="red_cmyk.100"
            borderRadius="md"
            borderWidth={1}
            borderColor="red_cmyk.500"
          >
            <Text color="red_cmyk.500" fontSize="sm">
              {errors.general}
            </Text>
          </Box>
        )}

        {/* Email */}
        <FormControl isInvalid={!!errors.email} isRequired>
          <FormLabel color="white">Email</FormLabel>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            bg="night.400"
            borderColor="ash_gray.500"
            color="white"
            _hover={{ borderColor: 'picton_blue.500' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          />
          <FormErrorMessage color="red_cmyk.500">{errors.email}</FormErrorMessage>
        </FormControl>

        {/* Password */}
        <FormControl isInvalid={!!errors.password} isRequired>
          <FormLabel color="white">Password</FormLabel>
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            bg="night.400"
            borderColor="ash_gray.500"
            color="white"
            _hover={{ borderColor: 'picton_blue.500' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          />
          <FormErrorMessage color="red_cmyk.500">{errors.password}</FormErrorMessage>
        </FormControl>

        {/* Submit Button */}
        <Button
          type="submit"
          bg="picton_blue.500"
          color="white"
          size="lg"
          w="full"
          isLoading={isLoading}
          loadingText="Logging in..."
          _hover={{ bg: 'picton_blue.600' }}
          _active={{ bg: 'picton_blue.700' }}
        >
          Login
        </Button>

        {/* Register Link */}
        <Text color="ash_gray.600" textAlign="center" fontSize="sm">
          Don't have an account?{' '}
          <ChakraLink as={Link} href="/register" color="picton_blue.500">
            Create one
          </ChakraLink>
        </Text>
      </VStack>
    </Box>
  );
}

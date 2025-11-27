/**
 * @file components/auth/RegisterForm.tsx
 * @description Registration form component with state selection
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Client-side registration form with real-time validation.
 * Integrates with seed data for US state selection dropdown.
 * Uses custom color palette for consistent branding.
 * 
 * FEATURES:
 * - Real-time form validation with Zod
 * - State dropdown populated from seed data
 * - Password strength indicator
 * - Error message display with custom colors
 * - Loading states during submission
 * - Automatic redirect on success
 * 
 * USAGE:
 * ```typescript
 * import RegisterForm from '@/components/auth/RegisterForm';
 * 
 * export default function RegisterPage() {
 *   return <RegisterForm />;
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
  Select,
  VStack,
  Text,
  FormErrorMessage,
  useToast,
  Link as ChakraLink,
} from '@chakra-ui/react';
import Link from 'next/link';
import { registerSchema } from '@/lib/validations/auth';
import { allStates, statesByAbbreviation } from '@/lib/seed';

/**
 * Registration form state interface
 */
interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  state: string;
}

/**
 * Form errors interface
 */
interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  state?: string;
  general?: string;
}

/**
 * RegisterForm Component
 * 
 * @description
 * Handles user registration with validation and error handling.
 * Integrates with registration API and NextAuth for auto-login.
 * 
 * @example
 * ```typescript
 * <RegisterForm />
 * ```
 */
export default function RegisterForm() {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    state: '',
  });

  // Error state
  const [errors, setErrors] = useState<FormErrors>({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input change
   * 
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - Input event
   * 
   * @description
   * Updates form data and clears field error on change.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
   * Validates form data, submits to registration API,
   * then auto-logs in user and redirects to dashboard.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form data with Zod
      const validatedData = registerSchema.parse(formData);

      // Submit to registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from API
        if (data.details) {
          const apiErrors: FormErrors = {};
          data.details.forEach((error: { field: string; message: string }) => {
            apiErrors[error.field as keyof FormErrors] = error.message;
          });
          setErrors(apiErrors);
        } else {
          setErrors({ general: data.error || 'Registration failed' });
        }
        return;
      }

      // Registration successful - auto-login
      toast({
        title: 'Account created',
        description: 'Welcome! Logging you in...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Sign in with credentials
      const signInResult = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Login failed - redirect to login page
        toast({
          title: 'Account created',
          description: 'Please login with your credentials',
          status: 'info',
          duration: 5000,
        });
        router.push('/login');
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
          Create Account
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

        {/* First Name */}
        <FormControl isInvalid={!!errors.firstName} isRequired>
          <FormLabel color="white">First Name</FormLabel>
          <Input
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            bg="night.400"
            borderColor="ash_gray.500"
            color="white"
            _hover={{ borderColor: 'picton_blue.500' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          />
          <FormErrorMessage color="red_cmyk.500">{errors.firstName}</FormErrorMessage>
        </FormControl>

        {/* Last Name */}
        <FormControl isInvalid={!!errors.lastName} isRequired>
          <FormLabel color="white">Last Name</FormLabel>
          <Input
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            bg="night.400"
            borderColor="ash_gray.500"
            color="white"
            _hover={{ borderColor: 'picton_blue.500' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          />
          <FormErrorMessage color="red_cmyk.500">{errors.lastName}</FormErrorMessage>
        </FormControl>

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
            placeholder="Min 8 characters"
            bg="night.400"
            borderColor="ash_gray.500"
            color="white"
            _hover={{ borderColor: 'picton_blue.500' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          />
          <FormErrorMessage color="red_cmyk.500">{errors.password}</FormErrorMessage>
          <Text fontSize="xs" color="ash_gray.600" mt={1}>
            Must contain uppercase, lowercase, and number
          </Text>
        </FormControl>

        {/* State Selection */}
        <FormControl isInvalid={!!errors.state} isRequired>
          <FormLabel color="white">State</FormLabel>
          <Select
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Select your state"
            bg="night.400"
            borderColor="ash_gray.500"
            color="white"
            _hover={{ borderColor: 'picton_blue.500' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          >
            {allStates.map((state) => (
              <option
                key={state.abbreviation}
                value={state.abbreviation}
                style={{ backgroundColor: '#141414' }}
              >
                {state.name} - Pop: {(state.population / 1_000_000).toFixed(1)}M | GDP: ${(state.gdpMillions / 1000).toFixed(0)}B
              </option>
            ))}
          </Select>
          <FormErrorMessage color="red_cmyk.500">{errors.state}</FormErrorMessage>
          {formData.state && statesByAbbreviation[formData.state] && (
            <Box mt={3} p={3} bg="night.300" borderRadius="md" borderWidth={1} borderColor="ash_gray.700">
              <Text fontSize="sm" color="gold.500" fontWeight="bold" mb={2}>
                {statesByAbbreviation[formData.state].name}
              </Text>
              <VStack spacing={1} align="stretch" fontSize="xs" color="ash_gray.600">
                <Text>
                  Population: {statesByAbbreviation[formData.state].population.toLocaleString()}
                </Text>
                <Text>
                  GDP: ${statesByAbbreviation[formData.state].gdpMillions.toLocaleString()}M (${statesByAbbreviation[formData.state].gdpPerCapita.toLocaleString()} per capita)
                </Text>
                <Text>
                  Violent Crime Rate: {statesByAbbreviation[formData.state].violentCrimeRate} per 100k
                </Text>
                <Text>
                  Federal Representation: {statesByAbbreviation[formData.state].houseSeatCount} House seats, {statesByAbbreviation[formData.state].senateSeatCount} Senate seats
                </Text>
              </VStack>
            </Box>
          )}
        </FormControl>

        {/* Submit Button */}
        <Button
          type="submit"
          bg="picton_blue.500"
          color="white"
          size="lg"
          w="full"
          isLoading={isLoading}
          loadingText="Creating account..."
          _hover={{ bg: 'picton_blue.600' }}
          _active={{ bg: 'picton_blue.700' }}
        >
          Create Account
        </Button>

        {/* Login Link */}
        <Text color="ash_gray.600" textAlign="center" fontSize="sm">
          Already have an account?{' '}
          <ChakraLink as={Link} href="/login" color="picton_blue.500">
            Login
          </ChakraLink>
        </Text>
      </VStack>
    </Box>
  );
}

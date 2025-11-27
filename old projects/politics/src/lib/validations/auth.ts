/**
 * @file src/lib/validations/auth.ts
 * @description Zod validation schemas for authentication flows
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Type-safe validation schemas for registration, login, and auth operations.
 * Uses Zod for runtime validation with TypeScript type inference.
 * Includes custom error messages for user-friendly feedback.
 * 
 * SCHEMAS:
 * - registerSchema: Full registration validation (email, password, names, state)
 * - loginSchema: Login validation (email, password)
 * - emailSchema: Email-only validation for password reset
 * - passwordSchema: Password-only validation for updates
 * 
 * USAGE:
 * ```typescript
 * import { registerSchema } from '@/lib/validations/auth';
 * 
 * const result = registerSchema.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.errors);
 * }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - All schemas return TypeScript types via z.infer<>
 * - Email validation uses RFC 5322 compliant regex
 * - Password requires min 8 chars with complexity rules
 * - State validation against 50 US states + DC
 * - Custom error messages for each validation rule
 */

import { z } from 'zod';

/**
 * Valid US state abbreviations (50 states + DC)
 * Synchronized with User model validation
 */
export const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

/**
 * Email validation schema
 * 
 * @description
 * Validates email format using RFC 5322 compliant regex.
 * Trims whitespace and converts to lowercase.
 * 
 * @example
 * ```typescript
 * const result = emailSchema.safeParse('user@example.com');
 * if (result.success) {
 *   console.log(result.data); // 'user@example.com'
 * }
 * ```
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email cannot exceed 255 characters');

/**
 * Password validation schema
 * 
 * @description
 * Validates password strength and complexity.
 * Requires minimum 8 characters.
 * 
 * @example
 * ```typescript
 * const result = passwordSchema.safeParse('SecurePass123');
 * if (result.success) {
 *   console.log('Password is valid');
 * }
 * ```
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

/**
 * First name validation schema
 * 
 * @description
 * Validates first name format and length.
 * Trims whitespace and validates character limits.
 */
export const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'First name is required')
  .max(50, 'First name cannot exceed 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'First name can only contain letters, spaces, hyphens, and apostrophes'
  );

/**
 * Last name validation schema
 * 
 * @description
 * Validates last name format and length.
 * Trims whitespace and validates character limits.
 */
export const lastNameSchema = z
  .string()
  .trim()
  .min(1, 'Last name is required')
  .max(50, 'Last name cannot exceed 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Last name can only contain letters, spaces, hyphens, and apostrophes'
  );

/**
 * State validation schema
 * 
 * @description
 * Validates US state abbreviation.
 * Accepts only valid 2-letter state codes (50 states + DC).
 * Converts to uppercase automatically.
 */
export const stateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'State must be a 2-letter abbreviation')
  .refine(
    (val) => VALID_STATES.includes(val as any),
    'Please select a valid US state'
  );

/**
 * Registration validation schema
 * 
 * @description
 * Complete validation for user registration.
 * Validates all required fields for new account creation.
 * 
 * @example
 * ```typescript
 * import { registerSchema } from '@/lib/validations/auth';
 * 
 * const formData = {
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   state: 'CA'
 * };
 * 
 * const result = registerSchema.safeParse(formData);
 * if (result.success) {
 *   // Create user with validated data
 *   await User.create(result.data);
 * }
 * ```
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  state: stateSchema,
});

/**
 * Login validation schema
 * 
 * @description
 * Validates login credentials (email and password only).
 * Used for authentication requests.
 * 
 * @example
 * ```typescript
 * import { loginSchema } from '@/lib/validations/auth';
 * 
 * const credentials = {
 *   email: 'user@example.com',
 *   password: 'SecurePass123'
 * };
 * 
 * const result = loginSchema.safeParse(credentials);
 * if (result.success) {
 *   // Attempt authentication
 * }
 * ```
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password cannot exceed 100 characters'),
});

/**
 * TypeScript types inferred from Zod schemas
 * 
 * @description
 * Type-safe interfaces automatically generated from validation schemas.
 * Use these types for function parameters and return values.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;

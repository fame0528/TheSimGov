/**
 * @fileoverview Validation Schemas
 * @module lib/utils/validation
 * 
 * OVERVIEW:
 * Centralized Zod validation schemas for forms and API inputs.
 * Type-safe validation with automatic TypeScript inference.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { z } from 'zod';

/**
 * Company validation schema
 */
export const companySchema = z.object({
  name: z.string().min(3, 'Company name must be at least 3 characters').max(50),
  industry: z.enum(['TECH', 'FINANCE', 'HEALTHCARE', 'ENERGY', 'MANUFACTURING', 'RETAIL']),
  description: z.string().max(500).optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;

/**
 * Employee validation schema
 */
export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  role: z.string().min(2).max(50),
  salary: z.number().min(0, 'Salary cannot be negative').max(10000000),
  skills: z.array(z.string()).optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

/**
 * Contract bid validation schema
 */
export const contractBidSchema = z.object({
  contractId: z.string(),
  price: z.number().min(0, 'Price cannot be negative'),
  timeline: z.number().min(1, 'Timeline must be at least 1 day'),
  message: z.string().max(500).optional(),
});

export type ContractBidInput = z.infer<typeof contractBidSchema>;

/**
 * Loan application validation schema
 */
export const loanApplicationSchema = z.object({
  amount: z.number().min(1000, 'Minimum loan amount is $1,000').max(10000000),
  term: z.number().min(1, 'Minimum term is 1 month').max(360),
  bankId: z.string(),
  purpose: z.string().max(500).optional(),
});

export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;

/**
 * Auth - Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Auth - Register validation schema
 */
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Generic validation helper
 * 
 * @example
 * ```typescript
 * const result = validate(companySchema, { name: 'Acme Corp', industry: 'TECH' });
 * if (result.success) {
 *   const company = result.data; // Type-safe
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: Automatic TypeScript inference with z.infer
 * 2. **Centralized**: Single source of truth for validation rules
 * 3. **Reusable**: Import schemas in forms, API routes, tests
 * 4. **Error Messages**: User-friendly validation feedback
 * 5. **Complex Rules**: Password strength, email format, ranges
 * 
 * PREVENTS:
 * - 52 duplicate validation logic blocks (legacy build)
 * - Inconsistent validation rules across frontend/backend
 * - Manual type definitions for validated data
 */

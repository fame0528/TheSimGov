/**
 * @file src/lib/validations/company.ts
 * @description Zod validation schemas for company operations
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Zod schemas for validating company creation, updates, and transaction requests.
 * Provides type-safe validation with detailed error messages for client-side and
 * API endpoint validation. Enforces business rules before database operations.
 * 
 * SCHEMAS:
 * - createCompanySchema: Validates company creation requests
 * - updateCompanySchema: Validates company update requests
 * - createTransactionSchema: Validates transaction logging requests
 * 
 * USAGE:
 * ```typescript
 * import { createCompanySchema } from '@/lib/validations/company';
 * 
 * // Validate form data
 * const result = createCompanySchema.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.flatten());
 * }
 * 
 * // Use in API endpoint
 * const validatedData = createCompanySchema.parse(requestBody);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - All schemas use .strict() to reject unknown fields
 * - Error messages are user-friendly for form validation
 * - Industry validation matches Company model enum
 * - Mission statement trimmed and optional
 * - Transaction validation includes type checking
 */

import { z } from 'zod';
import { INDUSTRIES } from '@/lib/constants/industries';

/**
 * Valid company industries
 * Imported from constants to ensure consistency across client/server
 */
const VALID_INDUSTRIES = [...INDUSTRIES] as const;

/**
 * Valid transaction types
 * Must match Transaction model TransactionType enum
 */
const VALID_TRANSACTION_TYPES = [
  'revenue',
  'expense',
  'loan',
  'investment',
  'transfer',
] as const;

/**
 * Company creation schema
 * 
 * @description
 * Validates company creation requests from registration form.
 * Enforces name length, industry selection, and optional mission statement.
 * 
 * @example
 * ```typescript
 * const data = {
 *   name: 'Acme Construction',
 *   industry: 'Construction',
 *   mission: 'Building the future'
 * };
 * 
 * const validatedData = createCompanySchema.parse(data);
 * ```
 */
export const createCompanySchema = z
  .object({
    name: z
      .string({
        required_error: 'Company name is required',
        invalid_type_error: 'Company name must be a string',
      })
      .trim()
      .min(3, 'Company name must be at least 3 characters')
      .max(50, 'Company name cannot exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9\s&.,'-]+$/,
        'Company name can only contain letters, numbers, spaces, and &.,\'-'
      ),

    industry: z.enum(VALID_INDUSTRIES, {
      required_error: 'Industry selection is required',
      invalid_type_error: 'Invalid industry selection',
    }),

    mission: z
      .string()
      .trim()
      .max(500, 'Mission statement cannot exceed 500 characters')
      .optional()
      .or(z.literal('')), // Allow empty string

    // Optional funding payload; REQUIRED for Technology industry when remaining capital < 0
    funding: z
      .object({
        type: z.enum(['Loan', 'Accelerator', 'Angel']),
        amount: z
          .number({ invalid_type_error: 'Funding amount must be a number' })
          .positive('Funding amount must be positive'),
        // Loan-specific fields
        interestRate: z
          .number()
          .min(0.1)
          .max(50)
          .optional(),
        termMonths: z
          .number()
          .int()
          .min(3)
          .max(360)
          .optional(),
      })
      .optional(),
    // Optional Technology sub-path selection: Software | AI | Hardware
    techPath: z
      .enum(['Software', 'AI', 'Hardware'])
      .optional(),
  })
  .strict(); // Reject unknown fields

/**
 * Inferred TypeScript type for company creation data
 * Use this for type-safe form handling
 */
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

/**
 * Company update schema
 * 
 * @description
 * Validates company update requests.
 * All fields are optional (partial update support).
 * Excludes owner and foundedAt (immutable fields).
 * 
 * @example
 * ```typescript
 * const data = {
 *   mission: 'Updated mission statement'
 * };
 * 
 * const validatedData = updateCompanySchema.parse(data);
 * ```
 */
export const updateCompanySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Company name must be at least 3 characters')
      .max(50, 'Company name cannot exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9\s&.,'-]+$/,
        'Company name can only contain letters, numbers, spaces, and &.,\'-'
      )
      .optional(),

    mission: z
      .string()
      .trim()
      .max(500, 'Mission statement cannot exceed 500 characters')
      .optional(),

    // Note: industry, owner, foundedAt are immutable and excluded
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Inferred TypeScript type for company update data
 */
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

/**
 * Transaction creation schema
 * 
 * @description
 * Validates transaction logging requests.
 * Ensures proper type, amount, and description.
 * Metadata is optional and flexible (any valid JSON).
 * 
 * @example
 * ```typescript
 * const data = {
 *   type: 'revenue',
 *   amount: 5000,
 *   description: 'Contract payment received',
 *   metadata: { contractId: '123abc' }
 * };
 * 
 * const validatedData = createTransactionSchema.parse(data);
 * ```
 */
export const createTransactionSchema = z
  .object({
    type: z.enum(VALID_TRANSACTION_TYPES, {
      required_error: 'Transaction type is required',
      invalid_type_error: 'Invalid transaction type',
    }),

    amount: z
      .number({
        required_error: 'Transaction amount is required',
        invalid_type_error: 'Amount must be a number',
      })
      .refine((val) => val !== 0, {
        message: 'Transaction amount cannot be zero',
      }),

    description: z
      .string({
        required_error: 'Transaction description is required',
        invalid_type_error: 'Description must be a string',
      })
      .trim()
      .min(3, 'Description must be at least 3 characters')
      .max(200, 'Description cannot exceed 200 characters'),

    metadata: z
      .record(z.unknown()) // Allow any key-value pairs
      .optional(),
  })
  .strict();

/**
 * Inferred TypeScript type for transaction creation data
 */
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

/**
 * Company query/filter schema
 * 
 * @description
 * Validates query parameters for listing/filtering companies.
 * Supports pagination and industry filtering.
 * 
 * @example
 * ```typescript
 * const query = {
 *   industry: 'Construction',
 *   limit: 20,
 *   skip: 0
 * };
 * 
 * const validatedQuery = companyQuerySchema.parse(query);
 * ```
 */
export const companyQuerySchema = z
  .object({
    industry: z.enum(VALID_INDUSTRIES).optional(),

    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10),

    skip: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0),

    sortBy: z
      .enum(['foundedAt', 'name', 'cash', 'revenue'])
      .optional()
      .default('foundedAt'),

    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
  })
  .strict();

/**
 * Inferred TypeScript type for company query parameters
 */
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;

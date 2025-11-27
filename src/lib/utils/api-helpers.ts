/**
 * @fileoverview API Authentication & Authorization Helpers
 * @module lib/utils/api-helpers
 * 
 * OVERVIEW:
 * Reusable authentication and authorization utilities for API routes.
 * Prevents code duplication across endpoints with standardized error handling.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import { IndustryType } from '@/lib/types';

/**
 * Authentication Result
 * Contains session data or error response
 */
export interface AuthResult {
  session: {
    userId: string;
    companyId: string;
  } | null;
  error: NextResponse | null;
}

/**
 * Company Authorization Result
 * Contains company document or error response
 */
export interface CompanyAuthResult {
  company: any | null;
  error: NextResponse | null;
}

/**
 * Authenticate Request
 * 
 * Validates NextAuth session and extracts user/company IDs.
 * Returns standardized error responses for unauthorized requests.
 * 
 * USAGE:
 * ```ts
 * const { session, error } = await authenticateRequest();
 * if (error) return error;
 * 
 * const { userId, companyId } = session!;
 * ```
 * 
 * @returns Session data or error response
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      ),
    };
  }

  const companyId = session.user.companyId;
  if (!companyId) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'No company associated with this user' },
        { status: 400 }
      ),
    };
  }

  return {
    session: {
      userId: session.user.id,
      companyId,
    },
    error: null,
  };
}

/**
 * Authorize Company Access
 * 
 * Verifies user owns the specified company and optionally checks industry.
 * Returns company document or standardized error responses.
 * 
 * USAGE:
 * ```ts
 * const { company, error } = await authorizeCompany(companyId, 'Technology');
 * if (error) return error;
 * 
 * // company is loaded and user is authorized
 * ```
 * 
 * @param companyId - Company ID to authorize
 * @param requiredIndustry - Optional industry requirement (e.g., 'Technology')
 * @param userId - Optional user ID for ownership check
 * @returns Company document or error response
 */
export async function authorizeCompany(
  companyId: string,
  requiredIndustry?: IndustryType,
  userId?: string
): Promise<CompanyAuthResult> {
  await connectDB();

  const company = await Company.findById(companyId);
  
  if (!company) {
    return {
      company: null,
      error: NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      ),
    };
  }

  // Verify ownership if userId provided
  if (userId && company.userId !== userId) {
    return {
      company: null,
      error: NextResponse.json(
        { error: 'Forbidden - Cannot access another company' },
        { status: 403 }
      ),
    };
  }

  // Verify industry requirement
  if (requiredIndustry && company.industry !== requiredIndustry) {
    return {
      company: null,
      error: NextResponse.json(
        { 
          error: `This feature requires ${requiredIndustry} industry`,
          currentIndustry: company.industry 
        },
        { status: 400 }
      ),
    };
  }

  return {
    company,
    error: null,
  };
}

/**
 * Validate Request Body
 * 
 * Generic Zod schema validation with standardized error responses.
 * 
 * USAGE:
 * ```ts
 * const { data, error } = await validateRequestBody(req, CreateAIModelSchema);
 * if (error) return error;
 * 
 * const modelData = data!; // Type-safe!
 * ```
 * 
 * @param req - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validated data or error response
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: any
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Invalid request data',
            details: result.error.errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      data: result.data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Failed to parse request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Handle API Error
 * 
 * Standardized error logging and response formatting.
 * 
 * USAGE:
 * ```ts
 * } catch (error) {
 *   return handleAPIError('[POST /api/ai/models]', error);
 * }
 * ```
 * 
 * @param context - Error context (route path)
 * @param error - Error object
 * @param message - Optional custom error message
 * @returns NextResponse with error
 */
export function handleAPIError(
  context: string,
  error: unknown,
  message: string = 'Internal server error'
): NextResponse {
  console.error(`${context} Error:`, error);
  
  // Extract error message if available
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  return NextResponse.json(
    { 
      error: message,
      details: errorMessage 
    },
    { status: 500 }
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Code Reuse**: Single source of truth for auth logic
 *    - Used across ALL API routes (AI, departments, employees, etc.)
 *    - Prevents duplication of session/company checks
 *    - Standardized error responses
 * 
 * 2. **Type Safety**: Full TypeScript support
 *    - Generic validateRequestBody<T> for schema inference
 *    - Strongly typed return values
 * 
 * 3. **Industry Checks**: Optional industry requirement
 *    - AI models/research require 'Technology' industry
 *    - Energy features require 'Energy' industry
 *    - Flexible for all industries
 * 
 * 4. **Error Handling**: Consistent error format
 *    - 401: Unauthorized (no session)
 *    - 403: Forbidden (wrong company)
 *    - 404: Not found
 *    - 400: Bad request (validation/industry)
 *    - 500: Server error
 * 
 * 5. **Composability**: Functions compose for complex auth flows
 *    ```ts
 *    const { session, error: authError } = await authenticateRequest();
 *    if (authError) return authError;
 *    
 *    const { company, error: companyError } = await authorizeCompany(
 *      session!.companyId,
 *      'Technology',
 *      session!.userId
 *    );
 *    if (companyError) return companyError;
 *    ```
 * 
 * PREVENTS:
 * - Code duplication across API routes (DRY principle)
 * - Inconsistent error messages
 * - Manual session/company checks
 * - Missing industry validation
 * - Unauthorized cross-company access
 */

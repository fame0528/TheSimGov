/**
 * @file app/api/auth/register/route.ts
 * @description User registration API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Handles new user registration with email/password/profile data.
 * Validates input with Zod schemas, creates MongoDB user document.
 * Returns success/error responses with appropriate HTTP status codes.
 * 
 * ENDPOINT:
 * POST /api/auth/register
 * 
 * REQUEST BODY:
 * {
 *   email: string (valid email format)
 *   password: string (min 8 chars, complexity requirements)
 *   firstName: string (1-50 chars, letters only)
 *   lastName: string (1-50 chars, letters only)
 *   state: string (valid US state abbreviation)
 * }
 * 
 * RESPONSES:
 * - 201: User created successfully
 * - 400: Validation error or duplicate email
 * - 500: Server error
 * 
 * USAGE:
 * ```typescript
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email, password, firstName, lastName, state })
 * });
 * const data = await response.json();
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Email uniqueness enforced by MongoDB index
 * - Password automatically hashed by User model pre-save hook
 * - Zod validation provides detailed error messages
 * - Returns sanitized user data (no password)
 * - Logs errors for debugging (no sensitive data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { registerSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

/**
 * POST /api/auth/register
 * 
 * @description
 * Creates a new user account with validated credentials.
 * Checks for duplicate email before creating user.
 * Returns created user data (excluding password).
 * 
 * @example
 * ```typescript
 * // Client-side registration
 * const formData = {
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   state: 'CA'
 * };
 * 
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(formData)
 * });
 * 
 * if (response.ok) {
 *   const { user } = await response.json();
 *   console.log('User created:', user.email);
 * } else {
 *   const { error } = await response.json();
 *   console.error('Registration failed:', error);
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validatedData = registerSchema.parse(body);
    const { email, password, firstName, lastName, state } = validatedData;

    // Connect to MongoDB
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email already registered. Please use a different email or login.' 
        },
        { status: 400 }
      );
    }

    // Create new user (password will be automatically hashed by pre-save hook)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      state,
    });

    // Return sanitized user data (exclude password)
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          state: user.state,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Handle MongoDB duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered',
        },
        { status: 400 }
      );
    }

    // Log error for debugging (no sensitive data)
    console.error('Registration error:', error);

    // Return generic error message
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}

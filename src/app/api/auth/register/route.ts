/**
 * @fileoverview User Registration API
 * @module app/api/auth/register
 * 
 * OVERVIEW:
 * API endpoint for new user registration.
 * Validates input, hashes password, creates user in database.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';
import { z } from 'zod';
import { STATE_ABBREVIATIONS } from '@/lib/utils/stateHelpers';
import type { Gender, Ethnicity } from '@/lib/types/portraits';

/**
 * Registration Request Validation Schema
 * 
 * Validates:
 * - First Name: 1-50 characters
 * - Last Name: 1-50 characters
 * - Email: Valid email format
 * - Password: Minimum 6 characters
 * - State: Valid 2-letter state abbreviation
 */
const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z]+$/, 'First name must contain only English letters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z]+$/, 'Last name must contain only English letters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  state: z
    .string()
    .length(2, 'State must be 2-letter abbreviation')
    .toUpperCase()
    .refine((val) => (STATE_ABBREVIATIONS as readonly string[]).includes(val), {
      message: 'Invalid state abbreviation',
    }),
  // Required demographics
  gender: z.enum(['Male', 'Female']),
  ethnicity: z.enum(['White', 'Black', 'Asian', 'Hispanic', 'Native American', 'Middle Eastern', 'Pacific Islander', 'Other']),
  dateOfBirth: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid date of birth',
  }),
  // Required avatar selection payload from client
  avatar: z.object({
    type: z.enum(['preset', 'upload']),
    imageUrl: z.string().min(1).optional(),
    portraitId: z.string().optional(),
    uploadUrl: z.string().optional(),
  }),
});

/**
 * POST /api/auth/register - Create new user account
 * 
 * Request Body:
 * - firstName: string (1-50 chars)
 * - lastName: string (1-50 chars)
 * - email: string (valid email format)
 * - password: string (min 6 chars)
 * - state: string (2-letter state abbreviation)
 * 
 * Responses:
 * - 201: User created successfully
 * - 400: Validation error or duplicate user
 * - 500: Server error
 * 
 * @param request - Next.js request object
 * @returns JSON response with user data or error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     password: 'secure123',
 *     state: 'CA'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log received payload for debugging (remove in production)
    console.log('[Register API] Received payload:', JSON.stringify(body, null, 2));

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('[Register API] Validation failed:', JSON.stringify(validationResult.error.errors, null, 2));
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, state, gender, ethnicity, avatar, dateOfBirth } = validationResult.data;

    // Connect to database
    await connectDB();

    // Check if user already exists by email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate username from firstName + lastName (must be unique, no number appending)
    const username = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Check if this exact name combination is already taken
    const existingUsername = await User.findOne({ username });
    
    if (existingUsername) {
      return NextResponse.json(
        { error: 'This name is already taken. Please use a different name.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new user
    // Derive imageUrl from avatar selection (required)
    let imageUrl: string | undefined;
    if (avatar?.type === 'preset' && avatar.imageUrl && avatar.imageUrl.startsWith('/portraits/')) {
      imageUrl = avatar.imageUrl;
    } else if (avatar?.type === 'upload' && avatar.uploadUrl && avatar.uploadUrl.startsWith('/avatars/')) {
      imageUrl = avatar.uploadUrl;
    }
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Avatar image is required and must be from /portraits or /avatars' },
        { status: 400 }
      );
    }

    const user = await User.create({
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      state,
      gender: gender as Gender,
      ethnicity: ethnicity as Ethnicity,
      dateOfBirth: new Date(dateOfBirth),
      imageUrl,
      createdAt: new Date(),
      companies: [],
    });

    // Return user data (excluding password)
    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          state: user.state,
          gender: user.gender ?? undefined,
          ethnicity: user.ethnicity ?? undefined,
          imageUrl: user.imageUrl ?? undefined,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Validation**: Zod schema validates all inputs including firstName, lastName, state
 * 2. **State Validation**: Ensures state is valid 2-letter abbreviation from STATE_ABBREVIATIONS
 * 3. **Security**: Bcrypt hashing with salt rounds = 12
 * 4. **Duplicate Check**: Prevents duplicate emails and usernames
 * 5. **Database**: MongoDB with Mongoose ODM
 * 6. **Error Handling**: User-friendly error messages
 * 
 * SECURITY FEATURES:
 * - Password hashing with bcrypt (cost factor 12)
 * - Email normalization (lowercase)
 * - Username validation (alphanumeric + underscore only)
 * - State validation (must be valid US state/territory)
 * - No password in response
 * - Specific error messages for duplicate detection
 * 
 * PREVENTS:
 * - SQL injection (NoSQL database)
 * - Weak passwords (minimum length enforcement)
 * - Invalid state selections (validation against STATE_ABBREVIATIONS)
 * - Duplicate accounts
 * - Password exposure in responses
 */

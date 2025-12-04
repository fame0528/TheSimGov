/**
 * @fileoverview Current User API Endpoint
 * @module app/api/user/me
 * 
 * OVERVIEW:
 * Returns current authenticated user's data from database.
 * Single source of truth for user information.
 * 
 * @created 2025-12-02
 * @author ECHO v1.3.3
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, User } from '@/lib/db';

/**
 * GET /api/user/me
 * 
 * Returns current user's data from database.
 * Ensures fresh data, not cached in session.
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findById(session.user.id)
            .select('username email firstName lastName cash companies')
            .lean();

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            cash: user.cash || 0,
            companies: user.companies || [],
        });
    } catch (error: any) {
        console.error('GET /api/user/me error:', error);

        // Handle database connection errors
        if (
            error?.message?.includes('DNS SRV') ||
            error?.message?.includes('ESERVFAIL') ||
            error?.code === 'ESERVFAIL' ||
            error?.name === 'MongooseServerSelectionError'
        ) {
            return NextResponse.json({
                error: 'Database connection error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }, { status: 503 });
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
